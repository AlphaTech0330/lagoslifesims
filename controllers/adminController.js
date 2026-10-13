const Player = require('../models/Player');

// POST /api/admin/grant-funds
exports.issuePlayerGrant = async (req, res) => {
  const { username, amount } = req.body;

  try {
    if (!username || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid username or grant amount' });
    }

    const player = await Player.findOne({ username: new RegExp(`^${username}$`, 'i') });

    if (!player) {
      return res.status(404).json({ success: false, message: `Player '${username}' not found.` });
    }

    player.cash += parseInt(amount, 10);
    await player.save();

    res.json({
      success: true,
      message: `Granted ₦${parseInt(amount, 10).toLocaleString()} to ${player.username}. New Balance: ₦${player.cash.toLocaleString()}`,
      player
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};