const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, patientVitalsSchema, batchDispatchSchema, rerouteSchema } = require('../middleware/validation');
const { dispatchPatient, reroutePatient, dispatchBatch } = require('../services/dispatchService');
const { predictSeverityAndCareNeeds } = require('../services/severityPredictor');
const { query } = require('../db/postgres');
const redis = require('../db/redis');

/**
 * POST /api/dispatch
 * Main dispatch endpoint — triage + routing in one call
 */
router.post('/', validate(patientVitalsSchema), asyncHandler(async (req, res) => {
  const result = await dispatchPatient(req.body);
  
  if (!result.success) {
    return res.status(422).json({ success: false, error: result.error });
  }

  res.status(201).json({
    success: true,
    message: 'Patient dispatched successfully',
    data: result,
  });
}));

/**
 * POST /api/dispatch/triage-only
 * Run severity prediction only — without triggering dispatch
 * Useful for pre-assessment before committing a dispatch
 */
router.post('/triage-only', asyncHandler(async (req, res) => {
  const prediction = predictSeverityAndCareNeeds(req.body);
  res.json({ success: true, data: prediction });
}));

/**
 * POST /api/dispatch/batch
 * Mass casualty event — route multiple patients at once
 */
router.post('/batch', validate(batchDispatchSchema), asyncHandler(async (req, res) => {
  const { mce_id, description, patients } = req.body;

  // Create MCE record
  await query(`
    INSERT INTO mass_casualty_events (incident_id, description, total_patients, status)
    VALUES ($1, $2, $3, 'active')
    ON CONFLICT (incident_id) DO UPDATE SET total_patients = EXCLUDED.total_patients
  `, [mce_id, description || 'Mass Casualty Event', patients.length]);

  const result = await dispatchBatch(patients, mce_id);
  res.status(201).json({ success: true, data: result });
}));

/**
 * POST /api/dispatch/:patientId/reroute
 * Recalculate routing mid-journey
 */
router.post('/:patientId/reroute', validate(rerouteSchema), asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { reason, current_latitude, current_longitude } = req.body;

  const currentLocation = (current_latitude && current_longitude)
    ? { latitude: current_latitude, longitude: current_longitude }
    : null;

  const result = await reroutePatient(patientId, reason, currentLocation);
  
  if (!result.success) {
    return res.status(422).json({ success: false, error: result.error });
  }

  res.json({ success: true, message: 'Patient rerouted', data: result });
}));

/**
 * GET /api/dispatch/:patientId
 * Get active dispatch status for a patient
 */
router.get('/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Try Redis first for live dispatch
  const activeDispatch = await redis.getActiveDispatch(patientId);
  if (activeDispatch) {
    return res.json({ success: true, source: 'live', data: activeDispatch });
  }

  // Fall back to DB
  const result = await query(`
    SELECT 
      d.*,
      p.incident_id, p.severity_level, p.news2_score, p.predicted_care_needs, p.status,
      h.name as hospital_name, h.address as hospital_address,
      h.latitude as hospital_latitude, h.longitude as hospital_longitude
    FROM dispatches d
    JOIN patients p ON p.id = d.patient_id
    JOIN hospitals h ON h.id = d.assigned_hospital_id
    WHERE d.patient_id = $1
    ORDER BY d.dispatched_at DESC
    LIMIT 1
  `, [patientId]);

  if (!result.rows.length) {
    return res.status(404).json({ success: false, error: 'Dispatch not found' });
  }

  res.json({ success: true, source: 'database', data: result.rows[0] });
}));

/**
 * PATCH /api/dispatch/:patientId/status
 * Update patient/dispatch status (arrived, treated, etc.)
 */
router.patch('/:patientId/status', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status } = req.body;

  const validStatuses = ['en_route', 'arrived', 'treated', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  await query(`UPDATE patients SET status = $1, updated_at = NOW() WHERE id = $2`, [status, patientId]);

  if (status === 'arrived') {
    await query(`UPDATE dispatches SET arrived_at = NOW() WHERE patient_id = $1`, [patientId]);
  } else if (status === 'treated') {
    await query(`UPDATE dispatches SET completed_at = NOW() WHERE patient_id = $1`, [patientId]);
    await redis.removeActiveDispatch(patientId);
  }

  res.json({ success: true, message: `Patient status updated to '${status}'` });
}));

module.exports = router;
