const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, hospitalCapacityUpdateSchema } = require('../middleware/validation');
const { query } = require('../db/postgres');
const redis = require('../db/redis');
const { getWebSocketBroadcaster } = require('../websocket/broadcaster');

/**
 * GET /api/hospitals
 * Get all hospitals with current capacity and specialist status
 */
router.get('/', asyncHandler(async (req, res) => {
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
    ORDER BY h.trauma_level ASC, h.name ASC
  `);

  res.json({ success: true, count: result.rowCount, data: result.rows });
}));

/**
 * GET /api/hospitals/:id
 * Get single hospital with full details
 */
router.get('/:id', asyncHandler(async (req, res) => {
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
    WHERE h.id = $1
    GROUP BY h.id
  `, [req.params.id]);

  if (!result.rows.length) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

/**
 * PATCH /api/hospitals/:id/capacity
 * Update hospital real-time capacity (called by hospital management systems)
 */
router.patch('/:id/capacity', validate(hospitalCapacityUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const broadcast = getWebSocketBroadcaster();

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.icu_beds_available !== undefined) {
    fields.push(`icu_beds_available = $${paramIndex++}`);
    values.push(updates.icu_beds_available);
  }
  if (updates.ventilators_available !== undefined) {
    fields.push(`ventilators_available = $${paramIndex++}`);
    values.push(updates.ventilators_available);
  }
  if (updates.current_load_percent !== undefined) {
    fields.push(`current_load_percent = $${paramIndex++}`);
    values.push(updates.current_load_percent);
  }
  if (updates.is_on_diversion !== undefined) {
    fields.push(`is_on_diversion = $${paramIndex++}`);
    values.push(updates.is_on_diversion);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE hospitals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.rows.length) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }

  const hospital = result.rows[0];

  // Log capacity change
  await query(`
    INSERT INTO hospital_capacity_log (hospital_id, icu_beds_available, ventilators_available, current_load_percent)
    VALUES ($1, $2, $3, $4)
  `, [id, hospital.icu_beds_available, hospital.ventilators_available, hospital.current_load_percent]);

  // Invalidate Redis cache
  await redis.invalidateHospitalCache(id);

  // Broadcast capacity update to dashboard
  broadcast({
    type: 'HOSPITAL_CAPACITY_UPDATED',
    hospitalId: id,
    hospitalName: hospital.name,
    updates,
    snapshot: {
      icu_beds_available: hospital.icu_beds_available,
      ventilators_available: hospital.ventilators_available,
      current_load_percent: hospital.current_load_percent,
      is_on_diversion: hospital.is_on_diversion,
    },
  });

  res.json({ success: true, message: 'Hospital capacity updated', data: hospital });
}));

/**
 * GET /api/hospitals/:id/capacity/history
 * Get capacity history for analytics
 */
router.get('/:id/capacity/history', asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;

  const result = await query(`
    SELECT * FROM hospital_capacity_log
    WHERE hospital_id = $1
      AND logged_at >= NOW() - INTERVAL '${parseInt(hours)} hours'
    ORDER BY logged_at DESC
  `, [req.params.id]);

  res.json({ success: true, data: result.rows });
}));

/**
 * PATCH /api/hospitals/:id/specialists/:specialistId
 * Toggle specialist on-duty status
 */
router.patch('/:id/specialists/:specialistId', asyncHandler(async (req, res) => {
  const { id, specialistId } = req.params;
  const { is_on_duty, on_call } = req.body;

  const result = await query(`
    UPDATE specialists SET
      is_on_duty = COALESCE($1, is_on_duty),
      on_call = COALESCE($2, on_call)
    WHERE id = $3 AND hospital_id = $4
    RETURNING *
  `, [is_on_duty, on_call, specialistId, id]);

  if (!result.rows.length) {
    return res.status(404).json({ success: false, error: 'Specialist not found' });
  }

  // Invalidate hospital cache
  await redis.invalidateHospitalCache(id);

  res.json({ success: true, data: result.rows[0] });
}));

module.exports = router;
