const express = require('express');

const router = express.Router();

// GET /api/health -> confirms the server is up (no auth, no data).
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'loan-advisor-api', time: new Date().toISOString() });
});

module.exports = router;
