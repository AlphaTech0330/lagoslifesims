const mongoose = require('mongoose');
const Faction = require('../models/Faction');
const Player = require('../models/Player');

/**
 * @desc    Create a new Transport Union Faction
 * @route   POST /api/factions/create
 * @access  Private
 */
exports.createFaction = async (req, res) => {
  const { name, tag, description, headquartersState } = req.body;
  const CREATION_COST = 500000; // ₦500,000 required to register a union

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const player = await Player.findById(req.user._id).session(session);

    if (player.faction) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'You are already a member of a transport union.' });
    }

    if (player.cash < CREATION_COST) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Registering a union costs ₦${CREATION_COST.toLocaleString()}` 
      });
    }

    // Deduct registration fee
    player.cash -= CREATION_COST;

    const faction = new Faction({
      name,
      tag,
      description,
      headquartersState,
      leader: player._id,
      members: [player._id],
      territoryControl: [{ state: headquartersState, influencePercentage: 25 }]
    });

    player.faction = faction._id;
    player.factionRole = 'Leader';

    await faction.save({ session });
    await player.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `Transport Union [${tag}] ${name} registered successfully!`,
      faction
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Join an existing Transport Union Faction
 * @route   POST /api/factions/join
 * @access  Private
 */
exports.joinFaction = async (req, res) => {
  const { factionId } = req.body;

  try {
    const player = await Player.findById(req.user._id);
    if (player.faction) {
      return res.status(400).json({ success: false, message: 'You must leave your current union before joining another.' });
    }

    const faction = await Faction.findById(factionId);
    if (!faction) {
      return res.status(404).json({ success: false, message: 'Transport Union not found.' });
    }

    faction.members.push(player._id);
    player.faction = faction._id;
    player.factionRole = 'Member';

    await faction.save();
    await player.save();

    res.json({
      success: true,
      message: `Joined ${faction.name} successfully!`,
      factionId: faction._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Deposit cash into Union Treasury
 * @route   POST /api/factions/treasury/deposit
 * @access  Private
 */
exports.depositToTreasury = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid deposit amount.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const player = await Player.findById(req.user._id).session(session);

    if (!player.faction) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'You do not belong to any transport union.' });
    }

    if (player.cash < amount) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Insufficient cash balance.' });
    }

    player.cash -= amount;
    await Faction.findByIdAndUpdate(
      player.faction, 
      { $inc: { treasuryBalance: amount } }, 
      { session }
    );

    await player.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: `Deposited ₦${amount.toLocaleString()} into the Union Treasury.`,
      remainingCash: player.cash
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get Multiplayer Leaderboards (Net Worth, Cargo Volume, Faction Power)
 * @route   GET /api/leaderboards?category=networth&limit=10
 * @access  Private
 */
exports.getLeaderboards = async (req, res) => {
  try {
    const { category = 'networth', limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 50);

    let leaderboardData;

    if (category === 'networth') {
      leaderboardData = await Player.find({})
        .select('username currentLocation cash netWorth totalTradesCompleted faction')
        .populate('faction', 'name tag')
        .sort({ netWorth: -1 })
        .limit(parsedLimit);

    } else if (category === 'haulage') {
      leaderboardData = await Player.find({})
        .select('username currentLocation totalCargoHauledKg totalTradesCompleted faction')
        .populate('faction', 'name tag')
        .sort({ totalCargoHauledKg: -1 })
        .limit(parsedLimit);

    } else if (category === 'factions') {
      leaderboardData = await Faction.find({})
        .select('name tag headquartersState treasuryBalance members leader')
        .populate('leader', 'username')
        .sort({ treasuryBalance: -1 })
        .limit(parsedLimit);

    } else {
      return res.status(400).json({ success: false, message: 'Invalid leaderboard category.' });
    }

    res.json({
      success: true,
      category,
      count: leaderboardData.length,
      leaderboard: leaderboardData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};