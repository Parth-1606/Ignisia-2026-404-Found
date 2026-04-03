require('dotenv').config();
const { pool, testConnection } = require('./postgres');

// ============================================================
// Hospitals sourced from PMC Hospital Infrastructure CSV
// GPS coordinates mapped to their real ward/zone locations
// ============================================================
const hospitals = [
  {
    name: 'Bharati Hospital & Research Centre',
    address: 'Dhankawadi, Pune 411043 (Zone 3 - Sahakarnagar-Dhankawadi)',
    latitude: 18.4575,
    longitude: 73.8508,
    trauma_level: 1,
    total_beds: 831,
    icu_beds_total: 85,
    icu_beds_available: 18,
    ventilators_total: 50,
    ventilators_available: 12,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: true,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 72,
    is_on_diversion: false,
  },
  {
    name: 'Deenanath Mangeshkar Hospital',
    address: 'Erandwane, Near Mhatre Bridge, Pune 411004 (Zone 3 - Warje-Karvenagar)',
    latitude: 18.5050,
    longitude: 73.8340,
    trauma_level: 1,
    total_beds: 812,
    icu_beds_total: 80,
    icu_beds_available: 25,
    ventilators_total: 48,
    ventilators_available: 18,
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
    name: 'KEM Hospital, Pune',
    address: 'Rasta Peth, Sardar Moodliar Rd, Pune 411011 (Zone 5 - Bhavani Peth)',
    latitude: 18.5074,
    longitude: 73.8658,
    trauma_level: 1,
    total_beds: 568,
    icu_beds_total: 55,
    icu_beds_available: 10,
    ventilators_total: 35,
    ventilators_available: 8,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 78,
    is_on_diversion: false,
  },
  {
    name: 'Ruby Hall Clinic',
    address: '40, Sassoon Road, Pune 411001 (Zone 1 - Dhole Patil Road)',
    latitude: 18.5196,
    longitude: 73.8789,
    trauma_level: 1,
    total_beds: 553,
    icu_beds_total: 65,
    icu_beds_available: 20,
    ventilators_total: 42,
    ventilators_available: 16,
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
    name: 'Kamla Nehru Hospital',
    address: 'Somwar Peth, Mangalwar Peth, Pune 411011 (Bhawani Peth WO)',
    latitude: 18.5107,
    longitude: 73.8670,
    trauma_level: 2,
    total_beds: 450,
    icu_beds_total: 40,
    icu_beds_available: 8,
    ventilators_total: 25,
    ventilators_available: 6,
    has_cath_lab: false,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: false,
    has_trauma_bay: true,
    current_load_percent: 82,
    is_on_diversion: false,
  },
  {
    name: 'Inlax & Budhrani Hospital (Sadhu Vaswani Mission)',
    address: '7, Koregaon Park, Pune 411001 (Zone 1 - Dhole Patil Road)',
    latitude: 18.5362,
    longitude: 73.8960,
    trauma_level: 1,
    total_beds: 369,
    icu_beds_total: 45,
    icu_beds_available: 15,
    ventilators_total: 30,
    ventilators_available: 12,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 50,
    is_on_diversion: false,
  },
  {
    name: 'Jehangir Hospital',
    address: '32, Sassoon Road, Pune 411001 (Zone 1 - Dhole Patil Road)',
    latitude: 18.5280,
    longitude: 73.8774,
    trauma_level: 1,
    total_beds: 335,
    icu_beds_total: 50,
    icu_beds_available: 18,
    ventilators_total: 38,
    ventilators_available: 14,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: true,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 48,
    is_on_diversion: false,
  },
  {
    name: 'Poona Hospital & Research Centre',
    address: '27, Sadashiv Peth, Pune 411030 (Zone 5 - Kasba-Vishram)',
    latitude: 18.5089,
    longitude: 73.8560,
    trauma_level: 2,
    total_beds: 300,
    icu_beds_total: 35,
    icu_beds_available: 12,
    ventilators_total: 22,
    ventilators_available: 9,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 62,
    is_on_diversion: false,
  },
  {
    name: 'Noble Hospital',
    address: 'Hadapsar, Magarpatta City, Pune 411028 (Zone 4 - Hadapsar-Mundhwa)',
    latitude: 18.5089,
    longitude: 73.9260,
    trauma_level: 2,
    total_beds: 250,
    icu_beds_total: 30,
    icu_beds_available: 10,
    ventilators_total: 20,
    ventilators_available: 7,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: false,
    has_trauma_bay: true,
    current_load_percent: 58,
    is_on_diversion: false,
  },
  {
    name: 'Sahyadri Super Speciality Hospital (Deccan)',
    address: 'Plot 30, Karve Rd, Deccan, Pune 411004 (Zone 2 - Shivajinagar-Ghole Road)',
    latitude: 18.5120,
    longitude: 73.8410,
    trauma_level: 1,
    total_beds: 202,
    icu_beds_total: 35,
    icu_beds_available: 14,
    ventilators_total: 25,
    ventilators_available: 10,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 52,
    is_on_diversion: false,
  },
  {
    name: 'Jupiter Hospital',
    address: 'Eastern Express Hwy, Baner, Pune 411045 (Zone 2 - Aundh-Baner)',
    latitude: 18.5590,
    longitude: 73.7868,
    trauma_level: 1,
    total_beds: 178,
    icu_beds_total: 30,
    icu_beds_available: 12,
    ventilators_total: 22,
    ventilators_available: 9,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: false,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 42,
    is_on_diversion: false,
  },
  {
    name: 'Sassoon General Hospital',
    address: 'Sassoon Road, Near Pune Station, Pune 411001',
    latitude: 18.5155,
    longitude: 73.8758,
    trauma_level: 1,
    total_beds: 1300,
    icu_beds_total: 90,
    icu_beds_available: 15,
    ventilators_total: 55,
    ventilators_available: 10,
    has_cath_lab: true,
    has_mri: true,
    has_ct_scanner: true,
    has_burn_unit: true,
    has_stroke_center: true,
    has_trauma_bay: true,
    current_load_percent: 85,
    is_on_diversion: false,
  },
];

// ============================================================
// Specialists assigned to each hospital
// ============================================================
const getSpecialists = (hospitalIds) => [
  // Bharati Hospital
  { hospital_id: hospitalIds[0], name: 'Dr. Rajesh Deshpande', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[0], name: 'Dr. Sneha Kulkarni', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[0], name: 'Dr. Meera Patil', specialty: 'burn_specialist', is_on_duty: true, on_call: false },

  // Deenanath Mangeshkar
  { hospital_id: hospitalIds[1], name: 'Dr. Nitin Kelkar', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[1], name: 'Dr. Sunita Gokhale', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[1], name: 'Dr. Arun Kale', specialty: 'trauma_surgeon', is_on_duty: false, on_call: true },
  { hospital_id: hospitalIds[1], name: 'Dr. Dipti Wagh', specialty: 'burn_specialist', is_on_duty: true, on_call: false },

  // KEM Hospital
  { hospital_id: hospitalIds[2], name: 'Dr. Sachin Gadgil', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[2], name: 'Dr. Kavita Mane', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[2], name: 'Dr. Amit Joshi', specialty: 'cardiologist', is_on_duty: false, on_call: true },

  // Ruby Hall Clinic
  { hospital_id: hospitalIds[3], name: 'Dr. Pankaj Shah', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[3], name: 'Dr. Anjali Deshmukh', specialty: 'cardiac_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[3], name: 'Dr. Vikram Rane', specialty: 'trauma_surgeon', is_on_duty: false, on_call: true },

  // Kamla Nehru Hospital
  { hospital_id: hospitalIds[4], name: 'Dr. Priya Nair', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[4], name: 'Dr. Sunil Jagtap', specialty: 'cardiologist', is_on_duty: false, on_call: true },

  // Inlax & Budhrani
  { hospital_id: hospitalIds[5], name: 'Dr. Sanjay Pawar', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[5], name: 'Dr. Rahul Bhosale', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },

  // Jehangir Hospital
  { hospital_id: hospitalIds[6], name: 'Dr. Manish Phadke', specialty: 'cardiac_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[6], name: 'Dr. Neelam Jadhav', specialty: 'neurosurgeon', is_on_duty: false, on_call: true },
  { hospital_id: hospitalIds[6], name: 'Dr. Suresh Thakur', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },

  // Poona Hospital
  { hospital_id: hospitalIds[7], name: 'Dr. Ashwin More', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[7], name: 'Dr. Rekha Chavan', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },

  // Noble Hospital
  { hospital_id: hospitalIds[8], name: 'Dr. Hemant Kadam', specialty: 'cardiologist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[8], name: 'Dr. Vaibhav Shinde', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },

  // Sahyadri Deccan
  { hospital_id: hospitalIds[9], name: 'Dr. Swati Kulkarni', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[9], name: 'Dr. Rajendra Patil', specialty: 'cardiac_surgeon', is_on_duty: true, on_call: false },

  // Jupiter Hospital
  { hospital_id: hospitalIds[10], name: 'Dr. Deepak Deore', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[10], name: 'Dr. Anita Bhat', specialty: 'neurosurgeon', is_on_duty: false, on_call: true },

  // Sassoon General Hospital
  { hospital_id: hospitalIds[11], name: 'Dr. Mahesh Gaikwad', specialty: 'trauma_surgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[11], name: 'Dr. Pooja Desai', specialty: 'neurosurgeon', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[11], name: 'Dr. Rakesh Sharma', specialty: 'burn_specialist', is_on_duty: true, on_call: false },
  { hospital_id: hospitalIds[11], name: 'Dr. Seema Khatri', specialty: 'cardiologist', is_on_duty: false, on_call: true },
];

const seed = async () => {
  console.log('[Seed] Starting database seeding...');
  console.log('[Seed] Data sourced from PMC Hospital Infrastructure CSV');

  const connected = await testConnection();
  if (!connected) {
    console.error('[Seed] Cannot connect to PostgreSQL. Exiting.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    await client.query('DELETE FROM specialists');
    await client.query('DELETE FROM dispatches');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM hospital_capacity_log');
    await client.query('DELETE FROM hospitals');
    console.log('[Seed] Cleared existing data');


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
