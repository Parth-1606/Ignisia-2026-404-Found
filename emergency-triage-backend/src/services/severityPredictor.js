/**
 * SEVERITY PREDICTION SERVICE
 * 
 * Implements NEWS2 (National Early Warning Score 2) — the clinical standard
 * used by NHS and major trauma centers for triage scoring.
 * 
 * Takes EMT-reported vitals → outputs:
 *   - NEWS2 score (0–20+)
 *   - Severity level (critical / high / moderate / low)
 *   - Predicted care needs (ICU, ventilator, specialist type, equipment)
 *   - Confidence breakdown per parameter
 */

// ============================================================
// NEWS2 SCORING TABLES (Clinical Standard)
// ============================================================

const scoreRespiratoryRate = (rr) => {
  if (rr === null || rr === undefined) return { score: 0, flag: 'missing' };
  if (rr <= 8)  return { score: 3, flag: 'critical' };
  if (rr <= 11) return { score: 1, flag: 'low' };
  if (rr <= 20) return { score: 0, flag: 'normal' };
  if (rr <= 24) return { score: 2, flag: 'elevated' };
  return         { score: 3, flag: 'critical' };
};

const scoreSpO2 = (spo2) => {
  if (spo2 === null || spo2 === undefined) return { score: 0, flag: 'missing' };
  if (spo2 <= 91) return { score: 3, flag: 'critical' };
  if (spo2 <= 93) return { score: 2, flag: 'high' };
  if (spo2 <= 95) return { score: 1, flag: 'elevated' };
  return           { score: 0, flag: 'normal' };
};

const scoreSystolicBP = (sbp) => {
  if (sbp === null || sbp === undefined) return { score: 0, flag: 'missing' };
  if (sbp <= 90)  return { score: 3, flag: 'critical' };
  if (sbp <= 100) return { score: 2, flag: 'high' };
  if (sbp <= 110) return { score: 1, flag: 'elevated' };
  if (sbp <= 219) return { score: 0, flag: 'normal' };
  return           { score: 3, flag: 'critical' };
};

const scoreHeartRate = (hr) => {
  if (hr === null || hr === undefined) return { score: 0, flag: 'missing' };
  if (hr <= 40)  return { score: 3, flag: 'critical' };
  if (hr <= 50)  return { score: 1, flag: 'low' };
  if (hr <= 90)  return { score: 0, flag: 'normal' };
  if (hr <= 110) return { score: 1, flag: 'elevated' };
  if (hr <= 130) return { score: 2, flag: 'high' };
  return          { score: 3, flag: 'critical' };
};

const scoreTemperature = (temp) => {
  if (temp === null || temp === undefined) return { score: 0, flag: 'missing' };
  if (temp <= 35.0) return { score: 3, flag: 'critical' };
  if (temp <= 36.0) return { score: 1, flag: 'low' };
  if (temp <= 38.0) return { score: 0, flag: 'normal' };
  if (temp <= 39.0) return { score: 1, flag: 'elevated' };
  return             { score: 2, flag: 'high' };
};

const scoreGCS = (gcs) => {
  if (gcs === null || gcs === undefined) return { score: 0, flag: 'missing' };
  if (gcs === 15) return { score: 0, flag: 'normal' };
  if (gcs >= 13)  return { score: 1, flag: 'elevated' };
  if (gcs >= 9)   return { score: 2, flag: 'high' };
  return           { score: 3, flag: 'critical' }; // GCS <= 8 = major neurological emergency
};

// ============================================================
// SYMPTOM → CARE NEED MAPPING
// ============================================================

const SYMPTOM_CARE_MAP = {
  // Neurological
  'head_injury':        { specialist: 'neurosurgeon', needs: ['ct_scanner', 'mri'], flag: 'neuro' },
  'stroke_symptoms':    { specialist: 'neurosurgeon', needs: ['ct_scanner', 'stroke_center'], flag: 'neuro' },
  'seizure':            { specialist: 'neurosurgeon', needs: ['ct_scanner'], flag: 'neuro' },
  'altered_consciousness': { specialist: 'neurosurgeon', needs: ['ct_scanner'], flag: 'neuro' },
  'paralysis':          { specialist: 'neurosurgeon', needs: ['mri', 'ct_scanner'], flag: 'neuro' },

  // Cardiac
  'chest_pain':         { specialist: 'cardiologist', needs: ['cath_lab', 'ct_scanner'], flag: 'cardiac' },
  'cardiac_arrest':     { specialist: 'cardiologist', needs: ['cath_lab'], flag: 'cardiac' },
  'palpitations':       { specialist: 'cardiologist', needs: ['ct_scanner'], flag: 'cardiac' },
  'stemi':              { specialist: 'cardiac_surgeon', needs: ['cath_lab'], flag: 'cardiac' },

  // Respiratory
  'respiratory_distress': { specialist: 'pulmonologist', needs: ['ventilator', 'icu'], flag: 'respiratory' },
  'shortness_of_breath':  { specialist: 'pulmonologist', needs: ['ct_scanner'], flag: 'respiratory' },
  'pneumonia':            { specialist: 'pulmonologist', needs: ['ct_scanner'], flag: 'respiratory' },

  // Trauma
  'major_trauma':       { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'ct_scanner', 'icu'], flag: 'trauma' },
  'penetrating_trauma': { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'icu'], flag: 'trauma' },
  'burns':              { specialist: 'burn_specialist', needs: ['burn_unit', 'icu'], flag: 'burn' },
  'amputation':         { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'icu'], flag: 'trauma' },

  // General
  'unconscious':        { specialist: 'trauma_surgeon', needs: ['icu', 'ct_scanner'], flag: 'critical' },
  'hemorrhage':         { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'icu'], flag: 'trauma' },
  'shock':              { specialist: 'trauma_surgeon', needs: ['icu', 'ventilator'], flag: 'critical' },
  'hypoglycemia':       { specialist: null, needs: [], flag: 'metabolic' },
  'allergic_reaction':  { specialist: null, needs: ['icu'], flag: 'allergic' },
};

const MECHANISM_CARE_MAP = {
  'mva_high_speed':   { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'icu', 'ct_scanner'] },
  'mva':              { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'ct_scanner'] },
  'fall_from_height': { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'ct_scanner'] },
  'fall':             { specialist: 'trauma_surgeon', needs: ['ct_scanner'] },
  'penetrating':      { specialist: 'trauma_surgeon', needs: ['trauma_bay', 'icu'] },
  'burn':             { specialist: 'burn_specialist', needs: ['burn_unit', 'icu'] },
  'drowning':         { specialist: 'pulmonologist', needs: ['ventilator', 'icu'] },
  'electrocution':    { specialist: 'cardiologist', needs: ['cath_lab', 'icu'] },
};

// ============================================================
// MAIN PREDICTION FUNCTION
// ============================================================

/**
 * Predict severity and care needs from EMT vitals
 * @param {Object} vitals - Patient vitals and symptom data
 * @returns {Object} - Prediction result with score, severity, care needs, rationale
 */
const predictSeverityAndCareNeeds = (vitals) => {
  const {
    heart_rate,
    systolic_bp,
    respiratory_rate,
    spo2,
    temperature,
    gcs_score,
    symptoms = [],
    mechanism_of_injury,
    age,
  } = vitals;

  // ---- Step 1: Calculate NEWS2 Score ----
  const rrScore     = scoreRespiratoryRate(respiratory_rate);
  const spo2Score   = scoreSpO2(spo2);
  const sbpScore    = scoreSystolicBP(systolic_bp);
  const hrScore     = scoreHeartRate(heart_rate);
  const tempScore   = scoreTemperature(temperature);
  const gcsScore    = scoreGCS(gcs_score);

  const news2Score = rrScore.score + spo2Score.score + sbpScore.score +
                     hrScore.score + tempScore.score + gcsScore.score;

  // Age modifier: patients >75 or <12 get +1
  const ageModifier = (age && (age > 75 || age < 12)) ? 1 : 0;
  const adjustedScore = news2Score + ageModifier;

  // ---- Step 2: Determine Severity Level ----
  let severityLevel;
  let severityRationale;

  if (adjustedScore >= 7 || rrScore.flag === 'critical' || spo2Score.flag === 'critical' ||
      sbpScore.flag === 'critical' || gcsScore.flag === 'critical') {
    severityLevel = 'critical';
    severityRationale = 'NEWS2 score ≥7 or one or more vitals critically abnormal — immediate resuscitation required';
  } else if (adjustedScore >= 5) {
    severityLevel = 'high';
    severityRationale = 'NEWS2 score 5–6 — urgent response required within 30 minutes';
  } else if (adjustedScore >= 3) {
    severityLevel = 'moderate';
    severityRationale = 'NEWS2 score 3–4 — increased monitoring required';
  } else {
    severityLevel = 'low';
    severityRationale = 'NEWS2 score 0–2 — routine assessment';
  }

  // ---- Step 3: Build Care Needs from Symptoms + Mechanism ----
  const careNeeds = {
    icu: false,
    ventilator: false,
    specialist: null,
    specialistUrgency: 'routine', // 'immediate', 'urgent', 'routine'
    equipment: new Set(),
    flags: [],
  };

  // From symptoms
  for (const symptom of symptoms) {
    const mapping = SYMPTOM_CARE_MAP[symptom.toLowerCase().replace(/ /g, '_')];
    if (mapping) {
      if (!careNeeds.specialist) careNeeds.specialist = mapping.specialist;
      mapping.needs.forEach(need => careNeeds.equipment.add(need));
      careNeeds.flags.push(mapping.flag);
    }
  }

  // From mechanism of injury
  if (mechanism_of_injury) {
    const mechKey = mechanism_of_injury.toLowerCase().replace(/ /g, '_');
    const mechMapping = MECHANISM_CARE_MAP[mechKey];
    if (mechMapping) {
      if (!careNeeds.specialist) careNeeds.specialist = mechMapping.specialist;
      mechMapping.needs.forEach(need => careNeeds.equipment.add(need));
    }
  }

  // Derive ICU and ventilator needs from severity + equipment
  if (severityLevel === 'critical') {
    careNeeds.icu = true;
    careNeeds.specialistUrgency = 'immediate';
  } else if (severityLevel === 'high') {
    careNeeds.specialistUrgency = 'urgent';
  }

  if (careNeeds.equipment.has('icu'))        careNeeds.icu = true;
  if (careNeeds.equipment.has('ventilator')) careNeeds.ventilator = true;

  // Critical vitals force ventilator need
  if (spo2 && spo2 <= 88) careNeeds.ventilator = true;
  if (respiratory_rate && (respiratory_rate <= 6 || respiratory_rate >= 30)) careNeeds.ventilator = true;
  if (gcs_score && gcs_score <= 8) {
    careNeeds.icu = true;
    careNeeds.ventilator = true; // Airway protection required at GCS ≤8
  }

  // ---- Step 4: Compile vital breakdown for explainability ----
  const vitalBreakdown = [
    { vital: 'Respiratory Rate', value: respiratory_rate ? `${respiratory_rate} breaths/min` : 'Not recorded', score: rrScore.score, flag: rrScore.flag },
    { vital: 'SpO2',             value: spo2 ? `${spo2}%` : 'Not recorded',                  score: spo2Score.score, flag: spo2Score.flag },
    { vital: 'Systolic BP',      value: systolic_bp ? `${systolic_bp} mmHg` : 'Not recorded', score: sbpScore.score, flag: sbpScore.flag },
    { vital: 'Heart Rate',       value: heart_rate ? `${heart_rate} bpm` : 'Not recorded',   score: hrScore.score, flag: hrScore.flag },
    { vital: 'Temperature',      value: temperature ? `${temperature}°C` : 'Not recorded',   score: tempScore.score, flag: tempScore.flag },
    { vital: 'GCS Score',        value: gcs_score ? `${gcs_score}/15` : 'Not recorded',      score: gcsScore.score, flag: gcsScore.flag },
  ];

  return {
    news2Score: adjustedScore,
    severityLevel,
    severityRationale,
    predictedCareNeeds: {
      icu: careNeeds.icu,
      ventilator: careNeeds.ventilator,
      specialist: careNeeds.specialist,
      specialistUrgency: careNeeds.specialistUrgency,
      equipment: Array.from(careNeeds.equipment),
      flags: [...new Set(careNeeds.flags)],
    },
    vitalBreakdown,
    ageModifier: ageModifier > 0 ? 'Applied +1 for age risk factor' : null,
  };
};

module.exports = { predictSeverityAndCareNeeds };
