const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  manifesto: {
    type: String,
    required: true,
    maxLength: 280
  },
  votes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const ElectionSchema = new mongoose.Schema({
  region: {
    type: String,
    enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  registrationFee: {
    type: Number,
    default: 100000 // ₦100,000 candidate registration fee
  },
  status: {
    type: String,
    enum: ['REGISTRATION', 'VOTING', 'CLOSED'],
    default: 'REGISTRATION'
  },
  candidates: [CandidateSchema],
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Election', ElectionSchema);