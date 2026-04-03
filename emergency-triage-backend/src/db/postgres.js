const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'emergency_triage',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20,                // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected client error:', err.message);
});

/**
 * Execute a query with optional parameters
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PG] Query executed in ${duration}ms | Rows: ${result.rowCount}`);
    }
    return result;
  } catch (err) {
    console.error('[PG] Query error:', err.message);
    throw err;
  }
};

/**
 * Get a client for transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  client.release = () => {
    client.release = release;
    return release();
  };

  return client;
};

/**
 * Run a transaction safely
 */
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('[PostgreSQL] Connected successfully at:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('[PostgreSQL] Connection failed:', err.message);
    return false;
  }
};

module.exports = { query, getClient, transaction, testConnection, pool };
