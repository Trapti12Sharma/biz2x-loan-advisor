const express = require('express');
const { getMyProfile, getProfileById } = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/profile', requireAuth, getMyProfile);
router.get('/users/:userId/profile', requireAuth, getProfileById);

module.exports = router;
