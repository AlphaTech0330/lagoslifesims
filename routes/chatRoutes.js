const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/authMiddleware');

// GET /api/chat/:channel - Fetch recent message history for a channel
router.get('/:channel', protect, async (req, res) => {
  try {
    const { channel } = req.params;
    const messages = await ChatMessage.find({ channel })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;