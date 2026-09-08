// Catches errors passed via next(err) and anything thrown in async route handlers
// wrapped with asyncHandler (see utils). Keeps error shape consistent across the API.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    // Postgres unique_violation (e.g. duplicate email)
    return res.status(409).json({ error: 'That value already exists.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end.' : err.message;
  res.status(status).json({ error: message });
}

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

module.exports = { errorHandler, asyncHandler };
