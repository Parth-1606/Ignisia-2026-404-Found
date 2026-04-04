require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const dispatchRoutes  = require('./routes/dispatch');
const hospitalRoutes  = require('./routes/hospitals');
const patientRoutes   = require('./routes/patients');
const chatRoutes      = require('./routes/chat');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================================
// SECURITY & MIDDLEWARE
// ============================================================
// Disable Helmet's Content Security Policy for the frontend to work normally during Dev. Or configure appropriately.
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting — extra strict on dispatch endpoint
const globalLimiter = rateLimit({ windowMs: 60_000, max: 200, message: { success: false, error: 'Rate limit exceeded' } });
const dispatchLimiter = rateLimit({ windowMs: 60_000, max: 60, message: { success: false, error: 'Dispatch rate limit exceeded' } });

app.use('/api', globalLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Emergency Triage & Routing System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/dispatch',  dispatchLimiter, dispatchRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients',  patientRoutes);
app.use('/api/chat',      chatRoutes);

// ============================================================
// FRONTEND INTEGRATION
// ============================================================
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================================
// ERROR HANDLERS
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
