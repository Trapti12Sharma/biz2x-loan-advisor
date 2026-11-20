const express = require('express');
const { emi, tenures } = require('../controllers/emiController');

const router = express.Router();

router.post('/', emi);
router.post('/compare-tenures', tenures);

module.exports = router;
