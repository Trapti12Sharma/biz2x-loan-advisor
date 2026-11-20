const express = require('express');
const { loginHandler, me } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// Brute-force protection on login (per IP).
router.post('/login', rateLimit({ windowMs: 60 * 1000, max: 10 }), loginHandler);
router.get('/me', requireAuth, me);

module.exports = router;
