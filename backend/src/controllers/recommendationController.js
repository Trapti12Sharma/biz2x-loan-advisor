const { recommend } = require('../services/recommendationService');
const store = require('../services/userDataStore');

// POST /api/recommendations  body: borrower profile (requires auth)
// The validated profile is saved under the caller's id so chat can use it later.
function createRecommendations(req, res) {
  const out = recommend(req.body);
  store.saveProfile(req.user.id, out.profile);
  res.json(out);
}

module.exports = { createRecommendations };
