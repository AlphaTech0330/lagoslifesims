const express = require('express');
const router = express.Router();
const { 
  getElections, 
  registerCandidacy, 
  castVote, 
  forceRotatePhase, 
  getTreasuryLedger // <--- Add this import
} = require('../controllers/electionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getElections);
router.get('/treasury/:region', protect, getTreasuryLedger);
router.post('/register', protect, registerCandidacy);
router.post('/vote', protect, castVote);
router.post('/force-rotate', protect, forceRotatePhase);

module.exports = router;