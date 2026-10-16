const Election = require('../models/Election');
const Player = require('../models/Player');
const TradeContract = require('../models/TradeContract');

/**
 * GET /api/elections
 * Fetch all active regional election ballots across Southwestern states
 */
exports.getElections = async (req, res) => {
  try {
    const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

    // Ensure an election record exists for every state
    for (const region of REGIONS) {
      let election = await Election.findOne({ region });
      if (!election) {
        await Election.create({
          region,
          phase: 'REGISTRATION',
          candidates: [],
          votes: []
        });
      }
    }

    const elections = await Election.find({})
      .populate('candidates.playerId', 'username cash')
      .populate('winner', 'username cash');

    res.json({ success: true, elections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/elections/register
 * Register candidacy for an upcoming regional election
 */
exports.registerCandidacy = async (req, res) => {
  const { electionId, manifesto } = req.body;

  try {
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election record not found.' });
    }

    if (election.phase !== 'REGISTRATION') {
      return res.status(400).json({ 
        success: false, 
        message: 'Candidacy registration is closed for this election cycle.' 
      });
    }

    const playerId = req.user._id;

    // Check if player is already registered as a candidate
    const alreadyRegistered = election.candidates.some(
      (c) => c.playerId.toString() === playerId.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already registered your candidacy for this election.' 
      });
    }

    election.candidates.push({
      playerId,
      manifesto: manifesto || 'Promoting fair interstate trade and regional prosperity.',
      voteCount: 0
    });

    await election.save();

    res.json({
      success: true,
      message: `Successfully registered as Union Candidate for ${election.region}!`,
      election
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/elections/vote
 * Cast a vote for a candidate in an active regional election
 */
exports.castVote = async (req, res) => {
  const { electionId, candidatePlayerId } = req.body;

  try {
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election record not found.' });
    }

    if (election.phase !== 'VOTING') {
      return res.status(400).json({ 
        success: false, 
        message: 'Voting is not active for this election cycle.' 
      });
    }

    const voterId = req.user._id;

    // Verify player hasn't already voted in this election cycle
    const alreadyVoted = election.votes.some(
      (v) => v.voterId.toString() === voterId.toString()
    );

    if (alreadyVoted) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already cast your ballot in this election.' 
      });
    }

    // Locate candidate and increment vote tally
    const candidateObj = election.candidates.find(
      (c) => c.playerId.toString() === candidatePlayerId.toString()
    );

    if (!candidateObj) {
      return res.status(400).json({ success: false, message: 'Candidate not found on this ballot.' });
    }

    candidateObj.voteCount += 1;
    election.votes.push({ voterId, candidatePlayerId });

    await election.save();

    res.json({
      success: true,
      message: `Ballot cast successfully in ${election.region} election!`,
      election
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/elections/force-rotate (Admin Command)
 * Rotate election phases (REGISTRATION -> VOTING -> CLOSED) and declare winner
 */
exports.forceRotatePhase = async (req, res) => {
  try {
    const elections = await Election.find({});

    for (const election of elections) {
      if (election.phase === 'REGISTRATION') {
        election.phase = 'VOTING';
      } else if (election.phase === 'VOTING') {
        election.phase = 'CLOSED';

        // Calculate winner with the highest vote count
        if (election.candidates.length > 0) {
          const sorted = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);
          election.winner = sorted[0].playerId;
        }
      } else if (election.phase === 'CLOSED') {
        // Reset cycle for new election term
        election.phase = 'REGISTRATION';
        election.candidates = [];
        election.votes = [];
        election.winner = null;
      }

      await election.save();
    }

    res.json({
      success: true,
      message: 'All regional union election cycles rotated successfully!',
      elections
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/elections/treasury/:region
 * Fetch Union Treasury metrics, total 2% P2P trade tax collections, and transaction log
 */
exports.getTreasuryLedger = async (req, res) => {
  try {
    const { region } = req.params;

    // 1. Fetch current regional election & Chairman
    const election = await Election.findOne({ region, phase: 'CLOSED' })
      .populate('winner', 'username cash');

    // 2. Fetch completed P2P trade contracts in this region to calculate total taxes collected
    const completedTrades = await TradeContract.find({ region, status: 'COMPLETED' })
      .populate('creator', 'username')
      .populate('fulfilledBy', 'username')
      .populate('item', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    // Calculate aggregate metrics
    const totalVolume = completedTrades.reduce((sum, t) => sum + (t.quantity * t.pricePerUnit), 0);
    const UNION_TAX_RATE = 0.02; // 2% Chairman Tax Rate
    const totalTaxesCollected = Math.round(totalVolume * UNION_TAX_RATE);

    // Format transaction ledger log
    const ledger = completedTrades.map((t) => {
      const grossValue = t.quantity * t.pricePerUnit;
      const taxCollected = Math.round(grossValue * UNION_TAX_RATE);

      return {
        id: t._id,
        date: t.updatedAt,
        seller: t.creator?.username || 'Trader',
        buyer: t.fulfilledBy?.username || 'Trader',
        commodity: t.item?.name || 'Goods',
        quantity: t.quantity,
        grossValue,
        taxCollected
      };
    });

    res.json({
      success: true,
      region,
      chairman: election?.winner || null,
      totalTaxesCollected,
      totalVolume,
      ledger
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};