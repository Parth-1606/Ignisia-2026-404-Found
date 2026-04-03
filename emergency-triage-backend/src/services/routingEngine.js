/**
 * CONSTRAINT-BASED HOSPITAL ROUTING ENGINE
 *
 * Takes predicted care needs + live hospital grid →
 * Scores each hospital against multiple constraints →
 * Returns optimal routing decision with full rationale
 *
 * Scoring weights (total = 100 points):
 *   - Care needs match:       35 pts  (can the hospital actually treat this patient?)
 *   - ICU/Bed availability:   20 pts  (does it have capacity right now?)
 *   - Hospital load:          15 pts  (how busy is it?)
 *   - Specialist availability:20 pts  (is the right doctor on duty?)
 *   - Transit time:           10 pts  (how far away is it?)
 */

const { query } = require('../db/postgres');
const { getAllHospitals, setAllHospitals, getMCEAllAssignments } = require('../db/redis');
const { estimateTransitTime } = require('./routingService');

// ============================================================
// SCORING WEIGHTS
// ============================================================
const WEIGHTS = {
  CARE_NEEDS_MATCH:       35,
  BED_AVAILABILITY:       20,
  HOSPITAL_LOAD:          15,
  SPECIALIST_AVAILABILITY:20,
  TRANSIT_TIME:           10,
};

// Maximum transit time before heavy penalty (minutes)
const MAX_ACCEPTABLE_TRANSIT = 30;

// ============================================================
// FETCH LIVE HOSPITAL GRID
// ============================================================

const fetchHospitalGrid = async () => {
  // Try Redis cache first
  const cached = await getAllHospitals();
  if (cached) return cached;

  // Cache miss — fetch from PostgreSQL
  const result = await query(`
    SELECT 
      h.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'specialty', s.specialty,
            'is_on_duty', s.is_on_duty,
            'on_call', s.on_call
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) as specialists
    FROM hospitals h
    LEFT JOIN specialists s ON s.hospital_id = h.id
    WHERE h.is_active = true
    GROUP BY h.id
    ORDER BY h.trauma_level ASC
  `);

  const hospitals = result.rows;
  await setAllHospitals(hospitals);
  return hospitals;
};

// ============================================================
// INDIVIDUAL SCORING FUNCTIONS
// ============================================================

/**
 * Score: Does the hospital have the required care capabilities?
 * Hard constraints: missing critical equipment = 0 score (disqualified)
 */
const scoreCareNeedsMatch = (hospital, careNeeds) => {
  const { equipment = [], icu, ventilator } = careNeeds;
  const reasons = [];
  let score = WEIGHTS.CARE_NEEDS_MATCH;
  let disqualified = false;
  const disqualifyReasons = [];

  // Hard constraints — disqualify if missing critical equipment
  if (icu && hospital.icu_beds_available <= 0) {
    disqualified = true;
    disqualifyReasons.push('No ICU beds available');
  }

  if (ventilator && hospital.ventilators_available <= 0) {
    disqualified = true;
    disqualifyReasons.push('No ventilators available');
  }

  const equipmentMap = {
    'cath_lab':     hospital.has_cath_lab,
    'mri':          hospital.has_mri,
    'ct_scanner':   hospital.has_ct_scanner,
    'burn_unit':    hospital.has_burn_unit,
    'stroke_center':hospital.has_stroke_center,
    'trauma_bay':   hospital.has_trauma_bay,
  };

  let matchCount = 0;
  let totalRequired = 0;
  for (const equip of equipment) {
    if (equipmentMap.hasOwnProperty(equip)) {
      totalRequired++;
      if (equipmentMap[equip]) {
        matchCount++;
        reasons.push(`✓ Has ${equip.replace(/_/g, ' ')}`);
      } else {
        reasons.push(`✗ Missing ${equip.replace(/_/g, ' ')}`);
        // Non-critical equipment: reduce score proportionally
        score -= Math.round(WEIGHTS.CARE_NEEDS_MATCH * 0.15);
      }
    }
  }

  // Trauma level bonus
  if (hospital.trauma_level === 1) {
    reasons.push('✓ Level 1 Trauma Center (highest capability)');
  } else if (hospital.trauma_level === 2) {
    reasons.push('✓ Level 2 Trauma Center');
  }

  if (disqualified) {
    return { score: 0, disqualified: true, reasons: disqualifyReasons };
  }

  return {
    score: Math.max(0, score),
    disqualified: false,
    reasons,
    matchCount,
    totalRequired,
  };
};

/**
 * Score: ICU and bed availability
 */
const scoreBedAvailability = (hospital, careNeeds) => {
  const reasons = [];
  let score = 0;

  if (careNeeds.icu) {
    const icuRatio = hospital.icu_beds_available / Math.max(hospital.icu_beds_total, 1);
    score = Math.round(WEIGHTS.BED_AVAILABILITY * icuRatio);
    reasons.push(`ICU beds available: ${hospital.icu_beds_available}/${hospital.icu_beds_total}`);
  } else {
    // General bed availability
    const generalAvailable = hospital.total_beds - Math.round(hospital.total_beds * hospital.current_load_percent / 100);
    const generalRatio = Math.min(generalAvailable / Math.max(hospital.total_beds * 0.2, 1), 1);
    score = Math.round(WEIGHTS.BED_AVAILABILITY * generalRatio);
    reasons.push(`General capacity: ${100 - hospital.current_load_percent}% available`);
  }

  if (careNeeds.ventilator) {
    const ventRatio = hospital.ventilators_available / Math.max(hospital.ventilators_total, 1);
    const ventScore = Math.round(WEIGHTS.BED_AVAILABILITY * 0.4 * ventRatio);
    score = Math.min(score, WEIGHTS.BED_AVAILABILITY); // cap at max weight
    reasons.push(`Ventilators available: ${hospital.ventilators_available}/${hospital.ventilators_total}`);
  }

  return { score: Math.min(score, WEIGHTS.BED_AVAILABILITY), reasons };
};

/**
 * Score: Hospital load — lower is better
 */
const scoreHospitalLoad = (hospital) => {
  const load = hospital.current_load_percent;
  const reasons = [];

  if (hospital.is_on_diversion) {
    return { score: 0, reasons: ['⚠ Hospital is on ambulance diversion — not accepting new patients'] };
  }

  let score;
  if (load <= 50)      { score = WEIGHTS.HOSPITAL_LOAD; reasons.push(`Low load: ${load}% capacity`); }
  else if (load <= 70) { score = Math.round(WEIGHTS.HOSPITAL_LOAD * 0.75); reasons.push(`Moderate load: ${load}% capacity`); }
  else if (load <= 85) { score = Math.round(WEIGHTS.HOSPITAL_LOAD * 0.4);  reasons.push(`High load: ${load}% capacity`); }
  else                 { score = Math.round(WEIGHTS.HOSPITAL_LOAD * 0.1);  reasons.push(`Critical load: ${load}% capacity — near full`); }

  return { score, reasons };
};

/**
 * Score: Specialist availability
 */
const scoreSpecialistAvailability = (hospital, careNeeds) => {
  const reasons = [];

  if (!careNeeds.specialist) {
    return { score: WEIGHTS.SPECIALIST_AVAILABILITY, reasons: ['No specialist required for this case'] };
  }

  const requiredSpecialty = careNeeds.specialist;
  const specialists = hospital.specialists || [];

  const onDuty = specialists.find(s => s.specialty === requiredSpecialty && s.is_on_duty);
  const onCall = specialists.find(s => s.specialty === requiredSpecialty && s.on_call);
  const affiliated = specialists.find(s => s.specialty === requiredSpecialty);

  if (onDuty) {
    reasons.push(`✓ ${requiredSpecialty.replace(/_/g, ' ')} on duty: ${onDuty.name}`);
    return { score: WEIGHTS.SPECIALIST_AVAILABILITY, reasons, specialist: onDuty };
  } else if (onCall) {
    reasons.push(`△ ${requiredSpecialty.replace(/_/g, ' ')} on call: ${onCall.name} (response time: ~15 min)`);
    if (careNeeds.specialistUrgency === 'immediate') {
      return { score: Math.round(WEIGHTS.SPECIALIST_AVAILABILITY * 0.4), reasons, specialist: onCall };
    }
    return { score: Math.round(WEIGHTS.SPECIALIST_AVAILABILITY * 0.7), reasons, specialist: onCall };
  } else if (affiliated) {
    reasons.push(`✗ ${requiredSpecialty.replace(/_/g, ' ')} not available (${affiliated.name} not on duty/call)`);
    return { score: Math.round(WEIGHTS.SPECIALIST_AVAILABILITY * 0.1), reasons, specialist: null };
  } else {
    reasons.push(`✗ No ${requiredSpecialty.replace(/_/g, ' ')} at this hospital`);
    return { score: 0, reasons, specialist: null };
  }
};

/**
 * Score: Transit time — closer is better, but not the only factor
 */
const scoreTransitTime = (transitMinutes) => {
  const reasons = [];
  let score;

  if (transitMinutes <= 5)       { score = WEIGHTS.TRANSIT_TIME;                             reasons.push(`Excellent: ${transitMinutes} min away`); }
  else if (transitMinutes <= 10) { score = Math.round(WEIGHTS.TRANSIT_TIME * 0.9);            reasons.push(`Very close: ${transitMinutes} min away`); }
  else if (transitMinutes <= 15) { score = Math.round(WEIGHTS.TRANSIT_TIME * 0.75);           reasons.push(`Close: ${transitMinutes} min away`); }
  else if (transitMinutes <= 20) { score = Math.round(WEIGHTS.TRANSIT_TIME * 0.55);           reasons.push(`Moderate distance: ${transitMinutes} min away`); }
  else if (transitMinutes <= 30) { score = Math.round(WEIGHTS.TRANSIT_TIME * 0.3);            reasons.push(`Far: ${transitMinutes} min away`); }
  else                           { score = Math.round(WEIGHTS.TRANSIT_TIME * 0.05);           reasons.push(`Very far: ${transitMinutes} min — significant delay`); }

  return { score, reasons };
};

// ============================================================
// MAIN ROUTING FUNCTION
// ============================================================

/**
 * Find the optimal hospital for a patient
 * @param {Object} careNeeds - Output from severityPredictor
 * @param {Object} incidentLocation - { latitude, longitude }
 * @param {Object} options - { mceId, excludeHospitalIds }
 * @returns {Object} - Optimal hospital + routing rationale + alternatives
 */
const findOptimalHospital = async (careNeeds, incidentLocation, options = {}) => {
  const { mceId, excludeHospitalIds = [] } = options;

  // Fetch live hospital grid
  const hospitals = await fetchHospitalGrid();

  // Get MCE assignment counts if this is a mass casualty event
  let mceAssignments = {};
  if (mceId) {
    mceAssignments = await getMCEAllAssignments(mceId);
  }

  const scoredHospitals = [];

  for (const hospital of hospitals) {
    // Skip explicitly excluded hospitals
    if (excludeHospitalIds.includes(hospital.id)) continue;

    // Get transit time estimate
    const transitResult = await estimateTransitTime(
      incidentLocation,
      { latitude: hospital.latitude, longitude: hospital.longitude }
    );
    const transitMinutes = transitResult.minutes;

    // Score each constraint
    const careScore        = scoreCareNeedsMatch(hospital, careNeeds);
    const bedScore         = scoreBedAvailability(hospital, careNeeds);
    const loadScore        = scoreHospitalLoad(hospital);
    const specialistScore  = scoreSpecialistAvailability(hospital, careNeeds);
    const transitScore     = scoreTransitTime(transitMinutes);

    // If hard constraints fail, disqualify
    if (careScore.disqualified) {
      scoredHospitals.push({
        hospital,
        totalScore: 0,
        disqualified: true,
        disqualifyReasons: careScore.reasons,
        transitMinutes,
        breakdown: { care: 0, beds: 0, load: 0, specialist: 0, transit: 0 },
      });
      continue;
    }

    let totalScore = careScore.score + bedScore.score + loadScore.score +
                     specialistScore.score + transitScore.score;

    // MCE load balancing penalty: reduce score if hospital already has many MCE patients
    let mcePenalty = 0;
    if (mceId && mceAssignments[hospital.id]) {
      const assignmentCount = mceAssignments[hospital.id];
      mcePenalty = Math.min(assignmentCount * 8, 40); // Max 40pt penalty
      totalScore = Math.max(0, totalScore - mcePenalty);
    }

    scoredHospitals.push({
      hospital,
      totalScore: Math.round(totalScore),
      disqualified: false,
      transitMinutes,
      transitRoute: transitResult.route,
      mcePenalty,
      mceAssignmentCount: mceAssignments[hospital.id] || 0,
      breakdown: {
        care:       careScore.score,
        beds:       bedScore.score,
        load:       loadScore.score,
        specialist: specialistScore.score,
        transit:    transitScore.score,
      },
      reasons: {
        care:       careScore.reasons,
        beds:       bedScore.reasons,
        load:       loadScore.reasons,
        specialist: specialistScore.reasons,
        transit:    transitScore.reasons,
      },
      specialistAssigned: specialistScore.specialist,
    });
  }

  // Sort by score descending
  scoredHospitals.sort((a, b) => b.totalScore - a.totalScore);

  const optimal = scoredHospitals[0];
  const alternatives = scoredHospitals.slice(1, 4); // Next 3 best options

  if (!optimal || optimal.disqualified) {
    return {
      success: false,
      error: 'No suitable hospital found matching the required care constraints.',
      alternatives: scoredHospitals.slice(0, 3),
    };
  }

  // Build human-readable rationale
  const rationale = buildRationale(optimal, alternatives, careNeeds);

  return {
    success: true,
    optimal: {
      hospital: optimal.hospital,
      totalScore: optimal.totalScore,
      transitMinutes: optimal.transitMinutes,
      transitRoute: optimal.transitRoute,
      breakdown: optimal.breakdown,
      reasons: optimal.reasons,
      specialistAssigned: optimal.specialistAssigned,
      mcePenalty: optimal.mcePenalty,
    },
    rationale,
    alternatives: alternatives.map(alt => ({
      hospital: alt.hospital,
      totalScore: alt.totalScore,
      transitMinutes: alt.transitMinutes,
      disqualified: alt.disqualified,
      disqualifyReasons: alt.disqualifyReasons,
      breakdown: alt.breakdown,
    })),
  };
};

// ============================================================
// RATIONALE BUILDER (Explainability Panel)
// ============================================================

const buildRationale = (optimal, alternatives, careNeeds) => {
  const h = optimal.hospital;
  const lines = [];

  lines.push(`ROUTING DECISION: ${h.name}`);
  lines.push(`OVERALL SCORE: ${optimal.totalScore}/100`);
  lines.push('');
  lines.push('WHY THIS HOSPITAL WAS CHOSEN:');

  if (careNeeds.icu)        lines.push(`  • Patient requires ICU — ${h.icu_beds_available} ICU beds available`);
  if (careNeeds.ventilator) lines.push(`  • Patient requires ventilator — ${h.ventilators_available} available`);
  if (careNeeds.specialist) lines.push(`  • Required specialist: ${careNeeds.specialist.replace(/_/g, ' ')} — ${optimal.specialistAssigned ? `${optimal.specialistAssigned.name} on ${optimal.specialistAssigned.is_on_duty ? 'duty' : 'call'}` : 'not available'}`);
  lines.push(`  • Hospital load: ${h.current_load_percent}%`);
  lines.push(`  • Estimated arrival: ${optimal.transitMinutes} minutes`);
  lines.push(`  • Trauma Level: ${h.trauma_level}`);

  if (alternatives.length > 0) {
    lines.push('');
    lines.push('ALTERNATIVES CONSIDERED:');
    for (const alt of alternatives) {
      if (alt.disqualified) {
        lines.push(`  ✗ ${alt.hospital.name}: DISQUALIFIED — ${(alt.disqualifyReasons || []).join(', ')}`);
      } else {
        lines.push(`  • ${alt.hospital.name}: Score ${alt.totalScore}/100 — ${alt.transitMinutes} min away`);
      }
    }
  }

  return lines.join('\n');
};

// ============================================================
// BATCH ROUTING (Mass Casualty Events)
// ============================================================

/**
 * Route multiple patients simultaneously during a mass casualty event
 * Uses load-balanced scoring to prevent any single hospital from being overwhelmed
 *
 * @param {Array} patients - Array of { patientId, careNeeds, incidentLocation }
 * @param {String} mceId - Mass casualty event ID
 * @returns {Array} - Routing decisions for all patients
 */
const batchRoute = async (patients, mceId) => {
  console.log(`[RoutingEngine] Batch routing ${patients.length} patients for MCE: ${mceId}`);

  // Sort patients by severity (critical first)
  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  patients.sort((a, b) => {
    const aOrder = severityOrder[a.careNeeds.severityLevel] ?? 4;
    const bOrder = severityOrder[b.careNeeds.severityLevel] ?? 4;
    return aOrder - bOrder;
  });

  const results = [];
  const assignedCounts = {}; // Track assignments per hospital during this batch

  for (const patient of patients) {
    const result = await findOptimalHospital(
      patient.careNeeds,
      patient.incidentLocation,
      { mceId, excludeHospitalIds: [] }
    );

    if (result.success) {
      const hospitalId = result.optimal.hospital.id;
      assignedCounts[hospitalId] = (assignedCounts[hospitalId] || 0) + 1;
    }

    results.push({
      patientId: patient.patientId,
      ...result,
    });
  }

  return {
    mceId,
    totalPatients: patients.length,
    successfulRoutings: results.filter(r => r.success).length,
    failedRoutings: results.filter(r => !r.success).length,
    hospitalLoadSummary: assignedCounts,
    routingDecisions: results,
  };
};

module.exports = { findOptimalHospital, batchRoute, fetchHospitalGrid };
