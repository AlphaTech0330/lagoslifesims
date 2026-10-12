const Player = require('../models/Player');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

/**
 * Helper: Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * @desc    Register a new player account
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password' });
    }

    // Check if player already exists
    const existingPlayer = await Player.findOne({ $or: [{ email }, { username }] });
    if (existingPlayer) {
      return res.status(400).json({ 
        success: false, 
        message: existingPlayer.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create player with default starting state
    const player = await Player.create({
      username,
      email,
      password: hashedPassword,
      currentLocation: 'Lagos',
      cash: 50000,
      energy: 100
    });

    const token = generateToken(player._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
        currentLocation: player.currentLocation,
        cash: player.cash,
        energy: player.energy
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Authenticate player & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find player by email
    const player = await Player.findOne({ email });
    if (!player) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, player.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(player._id);

    res.json({
      success: true,
      token,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
        currentLocation: player.currentLocation,
        cash: player.cash,
        energy: player.energy
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get currently logged-in player profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const player = await Player.findById(req.user._id).select('-password');
    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};