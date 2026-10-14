const express = require('express');
const router = express.Router();
const { getAvailableUpgrades, purchaseUpgrade } = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/upgrades', protect, getAvailableUpgrades);
router.post('/purchase-upgrade', protect, purchaseUpgrade);

module.exports = router;