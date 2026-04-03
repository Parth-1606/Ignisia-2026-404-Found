/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'Duplicate entry — record already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced record does not exist' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFoundHandler, asyncHandler };
