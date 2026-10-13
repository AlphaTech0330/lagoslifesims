const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  channel: {
    type: String, // 'GLOBAL' or regional state names ('Lagos', 'Ibadan', etc.)
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    maxLength: 500
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);