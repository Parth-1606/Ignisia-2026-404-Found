require('dotenv').config();
const { pool, testConnection } = require('./postgres');

// ============================================================
// SIMULATED HOSPITALS — Based on a major metro area grid
// ============================================================
const hospitals = [
  {
    name: 'Metro General Trauma Center',
    address: '1 Main St, Metro City',
    latitude: 40.7128,
    longitude: -74.0060,
    trauma_level: 1,
    total_beds: 500,
    icu_beds_total: 60,
    icu_beds_available: 12,
    ventilators_total: 40,
    ventilators_available: 8,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: true,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 75,
    is_on_diversion: false,
  },
  {
    name: 'Northside Heart & Vascular Hospital',
    address: '200 North Ave, Metro City',
    latitude: 40.7589,
    longitude: -73.9851,
    trauma_level: 2,
    total_beds: 300,
    icu_beds_total: 40,
    icu_beds_available: 18,
    ventilators_total: 25,
    ventilators_available: 14,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 55,
    is_on_diversion: false,
  },
  {
    name: 'Eastside Community Hospital',
    address: '450 East Blvd, Metro City',
    latitude: 40.6892,
    longitude: -73.9442,
    trauma_level: 3,
    total_beds: 200,
    icu_beds_total: 20,
    icu_beds_available: 4,
    ventilators_total: 12,
    ventilators_available: 2,
    has_cath_lab: false,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: false,
    has_trauma_bay: true,
    current_load_percent: 88,
    is_on_diversion: false,
  },
  {
    name: 'Westview Medical Center',
    address: '800 West Park Dr, Metro City',
    latitude: 40.7282,
    longitude: -74.0776,
    trauma_level: 2,
    total_beds: 350,
    icu_beds_total: 45,
    icu_beds_available: 22,
    ventilators_total: 30,
    ventilators_available: 19,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: true,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 45,
    is_on_diversion: false,
  },
  {
    name: 'Southport Regional Hospital',
    address: '12 Harbor Rd, Metro City',
    latitude: 40.6501,
    longitude: -74.0088,
    trauma_level: 3,
    total_beds: 180,
    icu_beds_total: 18,
    icu_beds_available: 9,
    ventilators_total: 10,
    ventilators_available: 5,
    has_cath_lab: false,
    has_mri: false,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: false,
    has_trauma_bay: false,
    current_load_percent: 60,
    is_on_diversion: false,
  },
  {
    name: 'University Neuroscience Hospital',
    address: '5 Academic Plaza, Metro City',
    latitude: 40.7448,
    longitude: -74.0324,
    trauma_level: 1,
    total_beds: 420,
    icu_beds_total: 55,
    icu_beds_available: 15,
    ventilators_total: 38,
    ventilators_available: 11,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 70,
    is_on_diversion: false,
  },
];

// ============================================================
// SIMULATED SPECIALISTS
// ============================================================
const getSpecialists = (hospitalIds) => [
  // Metro General
  { hospital_id: hospitalIds[0], name: 'Dr. Sarah Chen', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[0], name: 'Dr. James Patel', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[0], name: 'Dr. Amara Osei', specialty: 'cardiologist', is_on_duty: false, on_call: true },
  { hospital_id: hospitalIds[0], name: 'Dr. Luis Gomez', specialty: 'burn_specialist', is_on_duty: true, on_call: false },

  // Northside Heart
  { hospital_id: hospitalIds[1], name: 'Dr. Emily Walsh', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[1], name: 'Dr. Robert Kim', specialty: 'cardiac_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[1], name: 'Dr. Priya Nair', specialty: 'trauma_surgeon', is_on_duty: false, on_call: true },

  // Eastside Community
  { hospital_id: hospitalIds[2], name: 'Dr. Marcus Bell', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[2], name: 'Dr. Helen Foster', specialty: 'cardiologist', is_on_duty: false, on_call: false },

  // Westview
  { hospital_id: hospitalIds[3], name: 'Dr. Kevin Zhao', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[3], name: 'Dr. Sandra Mills', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[3], name: 'Dr. Tom Bradley', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[3], name: 'Dr. Yuki Tanaka', specialty: 'burn_specialist', is_on_duty: true, on_call: false },

  // Southport Regional
  { hospital_id: hospitalIds[4], name: 'Dr. Angela Ross', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },

  // University Neuroscience
  { hospital_id: hospitalIds[5], name: 'Dr. David Okonkwo', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[5], name: 'Dr. Claire Dubois', specialty: 'neurosurgeon', is_on_duty: false, on_call: true },
  { hospital_id: hospitalIds[5], name: 'Dr. Raj Mehta', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[5], name: 'Dr. Nina Volkov', specialty: 'cardiologist', is_on_duty: true, on_call: false },
];

const seed = async () => {
  console.log('[Seed] Starting database seeding...');

  const connected = await testConnection();
  if (!connected) {
    console.error('[Seed] Cannot connect to PostgreSQL. Exiting.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM specialists');
    await client.query('DELETE FROM dispatches');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM hospital_capacity_log');
    await client.query('DELETE FROM hospitals');
    console.log('[Seed] Cleared existing data');

    // Insert hospitals
    const hospitalIds = [];
    for (const hospital of hospitals) {
      const result = await client.query(
        `INSERT INTO hospitals (
          name, address, latitude, longitude, trauma_level,
          total_beds, icu_beds_total, icu_beds_available,
          ventilators_total, ventilators_available,
          has_cath_lab, has_mri, has_ct_scanner, has_burn_unit,
          has_stroke_center, has_trauma_bay,
          current_load_percent, is_on_diversion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING id`,
        [
          hospital.name, hospital.address, hospital.latitude, hospital.longitude,
          hospital.trauma_level, hospital.total_beds, hospital.icu_beds_total,
          hospital.icu_beds_available, hospital.ventilators_total,
          hospital.ventilators_available, hospital.has_cath_lab, hospital.has_mri,
          hospital.has_ct_scanner, hospital.has_burn_unit, hospital.has_stroke_center,
          hospital.has_trauma_bay, hospital.current_load_percent, hospital.is_on_diversion,
        ]
      );
      hospitalIds.push(result.rows[0].id);
      console.log(`[Seed] Inserted hospital: ${hospital.name}`);
    }

    // Insert specialists
    const specialists = getSpecialists(hospitalIds);
    for (const specialist of specialists) {
      await client.query(
        `INSERT INTO specialists (hospital_id, name, specialty, is_on_duty, on_call)
         VALUES ($1, $2, $3, $4, $5)`,
        [specialist.hospital_id, specialist.name, specialist.specialty, specialist.is_on_duty, specialist.on_call]
      );
    }
    console.log(`[Seed] Inserted ${specialists.length} specialists`);

    await client.query('COMMIT');
    console.log('\n[Seed] Database seeded successfully!');
    console.log(`  Hospitals: ${hospitals.length}`);
    console.log(`  Specialists: ${specialists.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
