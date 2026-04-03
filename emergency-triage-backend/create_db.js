require('dotenv').config();
const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: 'postgres' // connect to default DB
  });

  try {
    await client.connect();
    // Check if db exists
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'emergency_triage'`);
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE emergency_triage');
      console.log('Database emergency_triage created successfully.');
    } else {
      console.log('Database emergency_triage already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDb();
