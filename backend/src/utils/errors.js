// Error type for bad client input. errorHandler reads err.status -> HTTP 400.
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details; // optional: list of field-level problems
  }
}

module.exports = { ValidationError };
