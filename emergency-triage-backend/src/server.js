require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testConnection: testPG } = require('./db/postgres');
const redis = require('./db/redis');
const { initWebSocket } = require('./websocket/broadcaster');
const { startSimulation, stopSimulation } = require('./services/simulationEngine');

const PORT = parseInt(process.env.PORT) || 3000;

const startServer = async () => {
  console.log('\n========================================');
  console.log('  EMERGENCY TRIAGE & ROUTING SYSTEM');
  console.log('========================================\n');

  // ---- Connect to PostgreSQL ----
  const pgOk = await testPG();
  if (!pgOk) {
    console.error('[Server] PostgreSQL connection failed. Cannot start.');
    process.exit(1);
  }

  // ---- Connect to Redis ----
  try {
    await redis.connect();
    await redis.testConnection();
  } catch (err) {
    console.error('[Server] Redis connection failed:', err.message);
    console.warn('[Server] Continuing without Redis — caching disabled');
  }

  // ---- Create HTTP server ----
  const server = http.createServer(app);

  // ---- Initialize WebSocket ----
  initWebSocket(server);

  // ---- Start listening ----
  server.listen(PORT, () => {
    console.log(`\n[Server] HTTP server running at: http://localhost:${PORT}`);
    console.log(`[Server] WebSocket available at:  ws://localhost:${PORT}/ws`);
    console.log(`[Server] Health check:            http://localhost:${PORT}/health`);
    console.log(`\n[Server] API Endpoints:`);
    console.log(`  POST   /api/dispatch              — Dispatch a patient`);
    console.log(`  POST   /api/dispatch/triage-only  — Triage prediction only`);
    console.log(`  POST   /api/dispatch/batch         — Mass casualty batch routing`);
    console.log(`  POST   /api/dispatch/:id/reroute   — Reroute mid-journey`);
    console.log(`  GET    /api/hospitals               — All hospitals + capacity`);
    console.log(`  PATCH  /api/hospitals/:id/capacity  — Update hospital capacity`);
    console.log(`  GET    /api/patients                — Patient list`);
    console.log(`  GET    /api/patients/vitals/random — Random real vitals from CSV`);
    console.log('\n========================================\n');

    // ---- Start Real-Time Simulation ----
    startSimulation();
  });

  // ---- Graceful shutdown ----
  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    stopSimulation();
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      try {
        const { pool } = require('./db/postgres');
        await pool.end();
        console.log('[Server] PostgreSQL pool closed');
      } catch (e) {}
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

startServer();
