const Election = require('../models/Election');
const Player = require('../models/Player');
const { rotateRegionalElections } = require('../services/cronService');

// GET /api/elections - Fetch all active & past elections
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find({})
      .populate('candidates.player', 'username cash totalTradesCompleted')
      .populate('winner', 'username')
      .sort({ createdAt: -1 });

    res.json({ success: true, elections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/elections/register - Register candidacy for an election
exports.registerCandidate = async (req, res) => {
  const { electionId, manifesto } = req.body;

  try {
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election cycle not found' });
    }

    if (election.status !== 'REGISTRATION') {
      return res.status(400).json({ success: false, message: 'Candidate registration is closed for this cycle' });
    }

    const player = await Player.findById(req.user._id);

    const alreadyCandidate = election.candidates.some(
      (c) => c.player.toString() === player._id.toString()
    );

    if (alreadyCandidate) {
      return res.status(400).json({ success: false, message: 'You are already registered as a candidate for this election' });
    }

    if (player.cash < election.registrationFee) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient cash! Registration requires ₦${election.registrationFee.toLocaleString()}` 
      });
    }

    player.cash -= election.registrationFee;
    await player.save();

    election.candidates.push({
      player: player._id,
      manifesto: manifesto || 'Vote for prosperity and reduced interstate toll fees!'
    });

    await election.save();

    res.json({
      success: true,
      message: `Successfully registered candidacy for ${election.title}!`,
      remainingCash: player.cash,
      election
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/elections/vote - Cast a vote for a candidate
exports.castVote = async (req, res) => {
  const { electionId, candidatePlayerId } = req.body;

  try {
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    if (election.status !== 'VOTING') {
      return res.status(400).json({ success: false, message: 'Voting is currently closed for this election' });
    }

    const hasVoted = election.voters.some(
      (voterId) => voterId.toString() === req.user._id.toString()
    );

    if (hasVoted) {
      return res.status(400).json({ success: false, message: 'You have already cast your vote in this election cycle' });
    }

    const candidateObj = election.candidates.find(
      (c) => c.player.toString() === candidatePlayerId
    );

    if (!candidateObj) {
      return res.status(404).json({ success: false, message: 'Candidate not found in this election' });
    }

    candidateObj.votes += 1;
    election.voters.push(req.user._id);

    await election.save();

    res.json({
      success: true,
      message: 'Your vote has been cast successfully!',
      election
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/elections/close - Conclude voting & declare Union Chairman
exports.closeElection = async (req, res) => {
  const { electionId } = req.body;

  try {
    const election = await Election.findById(electionId);
    if (!election || election.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Invalid or already closed election' });
    }

    if (!election.candidates.length) {
      election.status = 'CLOSED';
      await election.save();
      return res.json({ success: true, message: 'Election closed with no registered candidates.' });
    }

    const sorted = [...election.candidates].sort((a, b) => b.votes - a.votes);
    const winnerCandidate = sorted[0];

    election.winner = winnerCandidate.player;
    election.status = 'CLOSED';
    await election.save();

    res.json({
      success: true,
      message: 'Election concluded! New Chairman elected.',
      winner: winnerCandidate.player
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/elections/force-rotate - Force rotation cycle (Dev / Admin testing)
exports.forceRotateElections = async (req, res) => {
  try {
    const io = req.app.get('socketio');
    await rotateRegionalElections(io);
    res.json({ success: true, message: 'Manually triggered election cycle rotation.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};