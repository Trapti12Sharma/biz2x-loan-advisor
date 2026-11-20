// Runs when no route matched the request.
function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Runs when any route/middleware throws or calls next(err).
// Four parameters = Express treats it as an error handler.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body from the client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  const status = err.status || 500;
  // Log full detail on the server only; never leak internals to the client.
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);

  const body = { error: status === 500 ? 'Something went wrong. Please try again.' : err.message };
  if (status === 400 && err.details) body.details = err.details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
