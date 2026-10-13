const express = require('express');
const router = express.Router();
const { 
  getElections, 
  registerCandidate, 
  castVote, 
  closeElection,
  forceRotateElections 
} = require('../controllers/electionController');

// Middleware Imports
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Standard Player Routes
router.get('/', protect, getElections);
router.post('/register', protect, registerCandidate);
router.post('/vote', protect, castVote);

// Restricted Admin Routes
router.post('/close', protect, adminOnly, closeElection);
router.post('/force-rotate', protect, adminOnly, forceRotateElections);

module.exports = router;