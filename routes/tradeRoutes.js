const express = require('express');
const router = express.Router();
const { getRegionalContracts, createContract, fulfillContract } = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:region', protect, getRegionalContracts);
router.post('/create', protect, createContract);
router.post('/fulfill', protect, fulfillContract);

module.exports = router;