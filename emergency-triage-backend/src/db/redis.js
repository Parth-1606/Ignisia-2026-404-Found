const { createClient } = require('redis');

let client = null;

const connect = async () => {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => console.error('[Redis] Error:', err.message));
  client.on('connect', () => console.log('[Redis] Connected successfully'));
  client.on('reconnecting', () => console.log('[Redis] Reconnecting...'));

  await client.connect();
  return client;
};

const getClient = () => {
  if (!client) throw new Error('Redis client not initialized. Call connect() first.');
  return client;
};

// ============================================================
// HOSPITAL CAPACITY CACHE
// Keys: hospital:{id}:capacity
// TTL: 60 seconds (refreshed on every update)
// ============================================================

const HOSPITAL_CAPACITY_TTL = 60; // seconds
const ALL_HOSPITALS_TTL = 30;

/**
 * Cache live hospital capacity snapshot
 */
const setHospitalCapacity = async (hospitalId, capacityData) => {
  const key = `hospital:${hospitalId}:capacity`;
  await client.setEx(key, HOSPITAL_CAPACITY_TTL, JSON.stringify(capacityData));
};

/**
 * Get cached hospital capacity
 */
const getHospitalCapacity = async (hospitalId) => {
  const key = `hospital:${hospitalId}:capacity`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Cache entire hospital grid (for routing engine)
 */
const setAllHospitals = async (hospitals) => {
  await client.setEx('hospitals:all', ALL_HOSPITALS_TTL, JSON.stringify(hospitals));
};

/**
 * Get cached hospital grid
 */
const getAllHospitals = async () => {
  const data = await client.get('hospitals:all');
  return data ? JSON.parse(data) : null;
};

/**
 * Invalidate hospital cache (call after any capacity update)
 */
const invalidateHospitalCache = async (hospitalId) => {
  await Promise.all([
    client.del(`hospital:${hospitalId}:capacity`),
    client.del('hospitals:all'),
  ]);
};

// ============================================================
// ACTIVE DISPATCH TRACKING
// Keys: dispatch:active:{patientId}
// ============================================================

const setActiveDispatch = async (patientId, dispatchData) => {
  const key = `dispatch:active:${patientId}`;
  await client.setEx(key, 3600, JSON.stringify(dispatchData)); // 1hr TTL
};

const getActiveDispatch = async (patientId) => {
  const key = `dispatch:active:${patientId}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const removeActiveDispatch = async (patientId) => {
  await client.del(`dispatch:active:${patientId}`);
};

// ============================================================
// MASS CASUALTY EVENT: Hospital assignment tracking
// Prevents one hospital from being overloaded during MCE
// ============================================================

const incrementMCEAssignment = async (mceId, hospitalId) => {
  const key = `mce:${mceId}:hospital:${hospitalId}:count`;
  const count = await client.incr(key);
  await client.expire(key, 7200); // 2hr TTL
  return count;
};

const getMCEAssignmentCount = async (mceId, hospitalId) => {
  const key = `mce:${mceId}:hospital:${hospitalId}:count`;
  const count = await client.get(key);
  return parseInt(count) || 0;
};

/**
 * Get all hospital assignment counts for an MCE event
 */
const getMCEAllAssignments = async (mceId) => {
  const pattern = `mce:${mceId}:hospital:*:count`;
  const keys = await client.keys(pattern);
  const assignments = {};
  for (const key of keys) {
    const hospitalId = key.split(':')[3];
    assignments[hospitalId] = parseInt(await client.get(key)) || 0;
  }
  return assignments;
};

// ============================================================
// GENERIC CACHE HELPERS
// ============================================================

const set = async (key, value, ttl = 300) => {
  await client.setEx(key, ttl, JSON.stringify(value));
};

const get = async (key) => {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const del = async (key) => {
  await client.del(key);
};

const testConnection = async () => {
  try {
    await client.ping();
    console.log('[Redis] Ping successful');
    return true;
  } catch (err) {
    console.error('[Redis] Ping failed:', err.message);
    return false;
  }
};

module.exports = {
  connect,
  getClient,
  testConnection,
  setHospitalCapacity,
  getHospitalCapacity,
  invalidateHospitalCache,
  setAllHospitals,
  getAllHospitals,
  setActiveDispatch,
  getActiveDispatch,
  removeActiveDispatch,
  incrementMCEAssignment,
  getMCEAssignmentCount,
  getMCEAllAssignments,
  set,
  get,
  del,
};
