const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../db/postgres');
const { getRandomVitals, getMultipleRandomVitals } = require('../services/vitalsDataService');

/**
 * GET /api/patients/vitals/random
 * Returns real patient vitals from the 200K-record dataset
 * Query params: ?risk=High Risk | Low Risk  &count=5
 */
router.get('/vitals/random', asyncHandler(async (req, res) => {
  const { risk, count = 1 } = req.query;
  const n = Math.min(parseInt(count) || 1, 20);

  if (n === 1) {
    const vitals = getRandomVitals(risk || null);
    if (!vitals) {
      return res.status(500).json({ success: false, error: 'Vitals dataset not available' });
    }
    return res.json({ success: true, data: vitals });
  }

  const vitals = getMultipleRandomVitals(n, risk || null);
  res.json({ success: true, count: vitals.length, data: vitals });
}));

/**
 * GET /api/patients
 * List all patients with optional filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, severity, limit = 50, offset = 0 } = req.query;

  let whereClause = '';
  const values = [];
  const conditions = [];

  if (status) {
    conditions.push(`p.status = $${values.length + 1}`);
    values.push(status);
  }
  if (severity) {
    conditions.push(`p.severity_level = $${values.length + 1}`);
    values.push(severity);
  }

  if (conditions.length) whereClause = `WHERE ${conditions.join(' AND ')}`;

  values.push(parseInt(limit), parseInt(offset));

  const result = await query(`
    SELECT 
      p.*,
      d.assigned_hospital_id,
      h.name as assigned_hospital_name,
      d.estimated_transit_minutes,
      d.dispatched_at,
      d.arrived_at
    FROM patients p
    LEFT JOIN dispatches d ON d.patient_id = p.id AND d.id = (
      SELECT id FROM dispatches WHERE patient_id = p.id ORDER BY dispatched_at DESC LIMIT 1
    )
    LEFT JOIN hospitals h ON h.id = d.assigned_hospital_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);

  res.json({ success: true, count: result.rowCount, data: result.rows });
}));

/**
 * GET /api/patients/:id
 * Get full patient record with dispatch history
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const patientResult = await query(`SELECT * FROM patients WHERE id = $1`, [req.params.id]);
  if (!patientResult.rows.length) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const dispatchResult = await query(`
    SELECT d.*, h.name as hospital_name, h.latitude, h.longitude
    FROM dispatches d
    JOIN hospitals h ON h.id = d.assigned_hospital_id
    WHERE d.patient_id = $1
    ORDER BY d.dispatched_at DESC
  `, [req.params.id]);

  res.json({
    success: true,
    data: {
      patient: patientResult.rows[0],
      dispatches: dispatchResult.rows,
    },
  });
}));

/**
 * GET /api/patients/analytics/summary
 * Dashboard summary stats
 */
router.get('/analytics/summary', asyncHandler(async (req, res) => {
  const [patients, dispatches, hospitals] = await Promise.all([
    query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity_level = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity_level = 'high') as high,
        COUNT(*) FILTER (WHERE severity_level = 'moderate') as moderate,
        COUNT(*) FILTER (WHERE severity_level = 'low') as low,
        COUNT(*) FILTER (WHERE status = 'dispatched') as active_dispatches,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
      FROM patients
    `),
    query(`
      SELECT 
        AVG(estimated_transit_minutes) as avg_transit_minutes,
        AVG(routing_score) as avg_routing_score,
        COUNT(*) FILTER (WHERE recalculation_count > 0) as rerouted_count
      FROM dispatches
      WHERE dispatched_at > NOW() - INTERVAL '24 hours'
    `),
    query(`
      SELECT 
        COUNT(*) as total_hospitals,
        COUNT(*) FILTER (WHERE is_on_diversion) as on_diversion,
        SUM(icu_beds_available) as total_icu_available,
        SUM(ventilators_available) as total_ventilators_available,
        ROUND(AVG(current_load_percent)) as avg_load_percent
      FROM hospitals
      WHERE is_active = true
    `),
  ]);

  res.json({
    success: true,
    data: {
      patients: patients.rows[0],
      dispatches: dispatches.rows[0],
      system: hospitals.rows[0],
    },
  });
}));

module.exports = router;
