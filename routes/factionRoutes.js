const express = require('express');
const router = express.Router();
const { 
  createFaction, 
  joinFaction, 
  depositToTreasury, 
  getLeaderboards 
} = require('../controllers/factionLeaderboardController');

const { protect } = require('../middleware/authMiddleware');

// Faction Routes
router.post('/create', protect, createFaction);
router.post('/join', protect, joinFaction);
router.post('/treasury/deposit', protect, depositToTreasury);

// Leaderboard Route
router.get('/leaderboards', protect, getLeaderboards);

module.exports = router;