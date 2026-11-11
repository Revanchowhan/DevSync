// Wrap async route handlers so rejected promises reach the error middleware.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 for unknown /api routes (and everything else).
// eslint-disable-next-line no-unused-vars
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found' });
}

// Centralized error middleware — always responds { error, details? }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose validation errors
  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ error: 'Validation failed', details });
  }
  // Duplicate key (e.g. email, duplicate pending team request)
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry: this record already exists' });
  }
  // Bad ObjectId in params
  if (err && err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  const status = err && err.status ? err.status : 500;
  // eslint-disable-next-line no-console
  if (status === 500) console.error('[error]', err);
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message || 'Something went wrong',
    ...(err && err.details ? { details: err.details } : {}),
  });
}

// Convenience for throwing HTTP errors from controllers.
function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

module.exports = { asyncHandler, notFound, errorHandler, httpError };
