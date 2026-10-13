const jwt = require('jsonwebtoken');
const Player = require('../models/Player');

// Helper to issue short-lived access token and long-lived HTTP-only refresh cookie
const generateTokens = (res, playerId) => {
  const token = jwt.sign({ id: playerId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: playerId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // Set HTTP-only Cookie for Refresh Token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingPlayer = await Player.findOne({ $or: [{ email }, { username }] });
    if (existingPlayer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email address is already registered.' 
      });
    }

    const player = await Player.create({
      username,
      email,
      password,
      currentLocation: 'Lagos',
      cash: 250000,
      energy: 100
    });

    const token = generateTokens(res, player._id);

    res.status(201).json({
      success: true,
      token,
      player
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const player = await Player.findOne({ email });
    if (!player || !(await player.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateTokens(res, player._id);

    res.json({
      success: true,
      token,
      player
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const player = await Player.findById(decoded.id);

    if (!player) {
      return res.status(401).json({ success: false, message: 'Player account not found' });
    }

    const newAccessToken = generateTokens(res, player._id);
    res.json({ success: true, token: newAccessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Expired or invalid refresh token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const player = await Player.findById(req.user._id).populate('inventory.itemId');
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};