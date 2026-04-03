/**
 * DISPATCH SERVICE
 * 
 * Orchestrates the full dispatch pipeline:
 * 1. Run severity prediction on patient vitals
 * 2. Run constraint-based routing to find optimal hospital
 * 3. Write dispatch decision to PostgreSQL
 * 4. Cache active dispatch in Redis
 * 5. Update hospital capacity
 * 6. Emit WebSocket event to dashboard
 */

const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/postgres');
const redis = require('../db/redis');
const { predictSeverityAndCareNeeds } = require('./severityPredictor');
const { findOptimalHospital, batchRoute } = require('./routingEngine');
const { getWebSocketBroadcaster } = require('../websocket/broadcaster');

// ============================================================
// SINGLE PATIENT DISPATCH
// ============================================================

/**
 * Full dispatch pipeline for a single patient
 */
const dispatchPatient = async (patientData) => {
  const broadcast = getWebSocketBroadcaster();

  // ---- Step 1: Save or update patient record ----
  const incidentId = patientData.incident_id || `INC-${Date.now()}`;

  const patientResult = await query(`
    INSERT INTO patients (
      incident_id, age, gender, weight_kg,
      heart_rate, systolic_bp, diastolic_bp,
      respiratory_rate, spo2, temperature, gcs_score, blood_glucose,
      symptoms, mechanism_of_injury, chief_complaint,
      incident_latitude, incident_longitude, incident_address,
      status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending'
    )
    ON CONFLICT (incident_id) DO UPDATE SET
      heart_rate = EXCLUDED.heart_rate,
      systolic_bp = EXCLUDED.systolic_bp,
      respiratory_rate = EXCLUDED.respiratory_rate,
      spo2 = EXCLUDED.spo2,
      gcs_score = EXCLUDED.gcs_score,
      symptoms = EXCLUDED.symptoms,
      status = 'pending',
      updated_at = NOW()
    RETURNING id
  `, [
    incidentId,
    patientData.age, patientData.gender, patientData.weight_kg,
    patientData.heart_rate, patientData.systolic_bp, patientData.diastolic_bp,
    patientData.respiratory_rate, patientData.spo2, patientData.temperature,
    patientData.gcs_score, patientData.blood_glucose,
    patientData.symptoms || [],
    patientData.mechanism_of_injury, patientData.chief_complaint,
    patientData.incident_latitude, patientData.incident_longitude,
    patientData.incident_address,
  ]);

  const patientId = patientResult.rows[0].id;

  // ---- Step 2: Run Severity Prediction ----
  broadcast({ type: 'DISPATCH_PROGRESS', patientId, stage: 'severity_prediction', message: 'Analyzing patient vitals...' });

  const prediction = predictSeverityAndCareNeeds(patientData);

  // Update patient with prediction results
  await query(`
    UPDATE patients SET
      news2_score = $1,
      severity_level = $2,
      predicted_care_needs = $3,
      status = 'dispatching',
      updated_at = NOW()
    WHERE id = $4
  `, [
    prediction.news2Score,
    prediction.severityLevel,
    JSON.stringify(prediction.predictedCareNeeds),
    patientId,
  ]);

  // ---- Step 3: Run Routing Engine ----
  broadcast({ type: 'DISPATCH_PROGRESS', patientId, stage: 'routing', message: 'Finding optimal hospital...' });

  const incidentLocation = {
    latitude: patientData.incident_latitude,
    longitude: patientData.incident_longitude,
  };

  const routingResult = await findOptimalHospital(
    { ...prediction.predictedCareNeeds, severityLevel: prediction.severityLevel },
    incidentLocation,
    { mceId: patientData.mce_id }
  );

  if (!routingResult.success) {
    await query(`UPDATE patients SET status = 'routing_failed' WHERE id = $1`, [patientId]);
    return { success: false, patientId, error: routingResult.error };
  }

  const { optimal, alternatives, rationale } = routingResult;

  // ---- Step 4: Save Dispatch Record ----
  const dispatchResult = await transaction(async (client) => {
    // Create dispatch record
    const dispatch = await client.query(`
      INSERT INTO dispatches (
        patient_id, assigned_hospital_id,
        routing_score, estimated_transit_minutes,
        routing_rationale, alternatives_evaluated,
        is_mass_casualty_event, mce_incident_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      patientId,
      optimal.hospital.id,
      optimal.totalScore,
      optimal.transitMinutes,
      JSON.stringify({ rationale, breakdown: optimal.breakdown, reasons: optimal.reasons }),
      JSON.stringify(alternatives),
      !!patientData.mce_id,
      patientData.mce_id || null,
    ]);

    // Update patient status to dispatched
    await client.query(`
      UPDATE patients SET status = 'dispatched', updated_at = NOW()
      WHERE id = $1
    `, [patientId]);

    // Decrease available resources at assigned hospital
    await client.query(`
      UPDATE hospitals SET
        icu_beds_available = GREATEST(0, icu_beds_available - $1),
        ventilators_available = GREATEST(0, ventilators_available - $2),
        current_load_percent = LEAST(100, current_load_percent + 2),
        updated_at = NOW()
      WHERE id = $3
    `, [
      prediction.predictedCareNeeds.icu ? 1 : 0,
      prediction.predictedCareNeeds.ventilator ? 1 : 0,
      optimal.hospital.id,
    ]);

    return dispatch.rows[0];
  });

  // ---- Step 5: Cache active dispatch in Redis ----
  const activeDispatch = {
    patientId,
    dispatchId: dispatchResult.id,
    hospital: optimal.hospital,
    transitMinutes: optimal.transitMinutes,
    prediction,
    routingResult,
    dispatchedAt: new Date().toISOString(),
  };

  await redis.setActiveDispatch(patientId, activeDispatch);
  await redis.invalidateHospitalCache(optimal.hospital.id);

  // If MCE, increment hospital assignment counter
  if (patientData.mce_id) {
    await redis.incrementMCEAssignment(patientData.mce_id, optimal.hospital.id);
  }

  // ---- Step 6: Broadcast to WebSocket clients ----
  broadcast({
    type: 'DISPATCH_COMPLETE',
    patientId,
    incidentId,
    severity: prediction.severityLevel,
    news2Score: prediction.news2Score,
    assignedHospital: {
      id: optimal.hospital.id,
      name: optimal.hospital.name,
      latitude: optimal.hospital.latitude,
      longitude: optimal.hospital.longitude,
    },
    transitMinutes: optimal.transitMinutes,
    score: optimal.totalScore,
    rationale,
    careNeeds: prediction.predictedCareNeeds,
    dispatchedAt: activeDispatch.dispatchedAt,
  });

  return {
    success: true,
    patientId,
    incidentId,
    dispatchId: dispatchResult.id,
    prediction,
    routing: routingResult,
    rationale,
  };
};

// ============================================================
// REROUTE — Mid-journey recalculation
// ============================================================

/**
 * Recalculate routing mid-journey (hospital reached capacity, road closure, etc.)
 */
const reroutePatient = async (patientId, reason, currentLocation) => {
  const broadcast = getWebSocketBroadcaster();

  // Get active dispatch
  const activeDispatch = await redis.getActiveDispatch(patientId);
  if (!activeDispatch) {
    throw new Error('No active dispatch found for patient');
  }

  // Get current dispatch from DB
  const dispatchRow = await query(
    `SELECT * FROM dispatches WHERE patient_id = $1 ORDER BY dispatched_at DESC LIMIT 1`,
    [patientId]
  );

  if (!dispatchRow.rows.length) throw new Error('Dispatch record not found');
  const dispatch = dispatchRow.rows[0];

  // Re-run routing excluding the original hospital
  const patientRow = await query(`SELECT * FROM patients WHERE id = $1`, [patientId]);
  const patient = patientRow.rows[0];

  const careNeeds = patient.predicted_care_needs;
  const location = currentLocation || {
    latitude: patient.incident_latitude,
    longitude: patient.incident_longitude,
  };

  const newRouting = await findOptimalHospital(careNeeds, location, {
    excludeHospitalIds: [dispatch.assigned_hospital_id],
  });

  if (!newRouting.success) {
    return { success: false, error: 'No alternative hospital available' };
  }

  // Update dispatch record
  const recalcLog = dispatch.recalculation_log || [];
  recalcLog.push({
    timestamp: new Date().toISOString(),
    reason,
    previousHospitalId: dispatch.assigned_hospital_id,
    newHospitalId: newRouting.optimal.hospital.id,
  });

  await query(`
    UPDATE dispatches SET
      assigned_hospital_id = $1,
      routing_score = $2,
      estimated_transit_minutes = $3,
      routing_rationale = $4,
      recalculation_count = recalculation_count + 1,
      recalculation_log = $5
    WHERE id = $6
  `, [
    newRouting.optimal.hospital.id,
    newRouting.optimal.totalScore,
    newRouting.optimal.transitMinutes,
    JSON.stringify({ rationale: newRouting.rationale, breakdown: newRouting.optimal.breakdown }),
    JSON.stringify(recalcLog),
    dispatch.id,
  ]);

  // Broadcast reroute event
  broadcast({
    type: 'PATIENT_REROUTED',
    patientId,
    reason,
    newHospital: {
      id: newRouting.optimal.hospital.id,
      name: newRouting.optimal.hospital.name,
      latitude: newRouting.optimal.hospital.latitude,
      longitude: newRouting.optimal.hospital.longitude,
    },
    newTransitMinutes: newRouting.optimal.transitMinutes,
    rationale: newRouting.rationale,
  });

  return { success: true, newRouting };
};

// ============================================================
// BATCH DISPATCH (Mass Casualty Event)
// ============================================================

const dispatchBatch = async (patientsData, mceId) => {
  const broadcast = getWebSocketBroadcaster();

  broadcast({ type: 'MCE_BATCH_STARTED', mceId, patientCount: patientsData.length });

  // Run triage prediction for all patients
  const preparedPatients = patientsData.map(p => ({
    patientId: p.incident_id || uuidv4(),
    careNeeds: {
      ...predictSeverityAndCareNeeds(p).predictedCareNeeds,
      severityLevel: predictSeverityAndCareNeeds(p).severityLevel,
    },
    incidentLocation: {
      latitude: p.incident_latitude,
      longitude: p.incident_longitude,
    },
  }));

  const batchResult = await batchRoute(preparedPatients, mceId);

  broadcast({ type: 'MCE_BATCH_COMPLETE', mceId, summary: batchResult });

  return batchResult;
};

module.exports = { dispatchPatient, reroutePatient, dispatchBatch };
