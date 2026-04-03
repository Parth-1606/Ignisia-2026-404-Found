/**
 * VITALS DATA SERVICE
 * 
 * Loads and serves real patient vitals from human_vital_signs_dataset_2024.csv
 * Used by the frontend to populate realistic Quick Scenarios
 */

const fs = require('fs');
const path = require('path');

let vitalsData = null;

const loadVitals = () => {
  if (vitalsData) return vitalsData;

  const csvPath = path.resolve(__dirname, '../../../human_vital_signs_dataset_2024.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.warn('[VitalsData] CSV file not found at:', csvPath);
    return null;
  }

  console.log('[VitalsData] Loading vitals dataset...');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const record = {};
    header.forEach((col, j) => {
      record[col] = vals[j] ? vals[j].trim() : '';
    });
    records.push(record);
  }

  vitalsData = records;
  console.log(`[VitalsData] Loaded ${records.length} patient records`);
  return vitalsData;
};

/**
 * Get a random patient vitals record from the dataset
 */
const getRandomVitals = (riskCategory = null) => {
  const data = loadVitals();
  if (!data) return null;

  let pool = data;
  if (riskCategory) {
    pool = data.filter(d => d['Risk Category'] === riskCategory);
    if (pool.length === 0) pool = data;
  }

  const record = pool[Math.floor(Math.random() * pool.length)];

  return {
    patient_id: record['Patient ID'],
    heart_rate: Math.round(parseFloat(record['Heart Rate'])),
    respiratory_rate: Math.round(parseFloat(record['Respiratory Rate'])),
    body_temperature: parseFloat(parseFloat(record['Body Temperature']).toFixed(1)),
    spo2: Math.round(parseFloat(record['Oxygen Saturation'])),
    systolic_bp: Math.round(parseFloat(record['Systolic Blood Pressure'])),
    diastolic_bp: Math.round(parseFloat(record['Diastolic Blood Pressure'])),
    age: parseInt(record['Age']),
    gender: (record['Gender'] || 'unknown').toLowerCase(),
    weight_kg: parseFloat(parseFloat(record['Weight (kg)']).toFixed(1)),
    height_m: parseFloat(parseFloat(record['Height (m)']).toFixed(2)),
    derived_hrv: parseFloat(parseFloat(record['Derived_HRV']).toFixed(3)),
    pulse_pressure: Math.round(parseFloat(record['Derived_Pulse_Pressure'])),
    bmi: parseFloat(parseFloat(record['Derived_BMI']).toFixed(1)),
    map: parseFloat(parseFloat(record['Derived_MAP']).toFixed(1)),
    risk_category: record['Risk Category'],
  };
};

/**
 * Get multiple random vitals records
 */
const getMultipleRandomVitals = (count = 5, riskCategory = null) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(getRandomVitals(riskCategory));
  }
  return results;
};

module.exports = { loadVitals, getRandomVitals, getMultipleRandomVitals };
