const express = require('express');
const router = express.Router();
const { issuePlayerGrant } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/grant-funds', protect, adminOnly, issuePlayerGrant);

module.exports = router;