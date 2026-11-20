const { login } = require('../services/authService');

// POST /api/auth/login  body: { email, password }
function loginHandler(req, res) {
  const { email, password } = req.body || {};
  res.json(login(email, password));
}

// GET /api/auth/me  (requires auth)
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { loginHandler, me };
