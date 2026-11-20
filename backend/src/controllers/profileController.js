const store = require('../services/userDataStore');

// GET /api/profile -> the caller's own saved profile (identity comes from the token only)
function getMyProfile(req, res) {
  res.json({ profile: store.getProfile(req.user.id) || null });
}

// GET /api/users/:userId/profile -> allowed ONLY when :userId is the caller (blocks IDOR).
function getProfileById(req, res) {
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'You can only access your own data' });
  }
  res.json({ profile: store.getProfile(req.user.id) || null });
}

module.exports = { getMyProfile, getProfileById };
