const express = require('express');
const { createRecommendations } = require('../controllers/recommendationController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/', requireAuth, createRecommendations);

module.exports = router;
