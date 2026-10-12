const express = require('express');
const router = express.Router();
const { getProperties, buyProperty, leaseProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProperties);
router.post('/buy', protect, buyProperty);
router.post('/lease', protect, leaseProperty);

module.exports = router;
