const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxCapacity: { type: Number, required: true, default: 5000 }, // in kg
  status: { type: String, enum: ['IDLE', 'IN_TRANSIT'], default: 'IDLE' },
  topSpeed: { type: Number, default: 80 },
  fuelEfficiency: { type: Number, default: 1.0 },
  inventory: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      weight: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  installedUpgrades: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Truck', truckSchema);