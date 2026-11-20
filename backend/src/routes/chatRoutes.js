const express = require('express');
const { chat, history, clearHistory } = require('../controllers/chatController');
const requireAuth = require('../middleware/requireAuth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

router.use(requireAuth); // every chat route needs a valid token
router.post('/', rateLimit({ windowMs: 60 * 1000, max: 20 }), chat); // protects LLM cost
router.get('/history', history);
router.delete('/history', clearHistory);

module.exports = router;
