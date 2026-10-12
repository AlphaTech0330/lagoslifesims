const mongoose = require('mongoose');

const factionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Lagos Central Transport Union", "Oyo Agro-Transit Guild"
  tag: { type: String, required: true, unique: true, uppercase: true, maxlength: 4 }, // e.g., "NURT", "PMC"
  description: { type: String, maxlength: 250 },
  headquartersState: { 
    type: String, 
    required: true, 
    enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'] 
  },
  leader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true 
  },
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  treasuryBalance: { type: Number, default: 100000 }, // Union Vault in Naira
  territoryControl: [{
    state: { type: String, enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'] },
    influencePercentage: { type: Number, default: 0, min: 0, max: 100 }
  }],
  perks: {
    interstateTollDiscount: { type: Number, default: 0.15 }, // 15% discount on highway tolls
    cargoProtectionRate: { type: Number, default: 0.20 }, // 20% lower chance of highway hijacking/loss
    weeklyBonusPayout: { type: Number, default: 50000 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Faction', factionSchema);