const mongoose = require('mongoose');

const TradeContractSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  type: {
    type: String,
    enum: ['BUY_ORDER', 'SELL_ORDER', 'DIRECT_SWAP'],
    required: true
  },
  region: {
    type: String,
    enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'],
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['OPEN', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN'
  },
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('TradeContract', TradeContractSchema);