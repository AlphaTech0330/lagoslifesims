const express = require('express');
const router = express.Router();
const { 
  getElections, 
  registerCandidate, 
  castVote, 
  closeElection,
  forceRotateElections 
} = require('../controllers/electionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getElections);
router.post('/register', protect, registerCandidate);
router.post('/vote', protect, castVote);
router.post('/close', protect, closeElection);
router.post('/force-rotate', protect, forceRotateElections);

module.exports = router;