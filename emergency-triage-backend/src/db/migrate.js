require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./postgres');

const migrate = async () => {
  console.log('[Migrate] Starting database migration...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('[Migrate] Cannot connect to PostgreSQL. Exiting.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schemaSql);
    console.log('[Migrate] Schema applied successfully!');
  } catch (err) {
    console.error('[Migrate] Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
