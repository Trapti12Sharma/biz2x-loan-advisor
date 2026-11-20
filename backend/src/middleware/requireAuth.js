const { authenticate } = require('../services/authService');

// Guard middleware. After it runs, req.user.id is the ONLY trusted identity.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = authenticate(token); // throws AuthError(401) if bad -> errorHandler
  next();
}

module.exports = requireAuth;
