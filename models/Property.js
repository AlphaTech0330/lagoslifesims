const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  state: { 
    type: String, 
    required: true, 
    enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'] 
  },
  district: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['Warehouse', 'Retail Shop', 'Residential Flat', 'Industrial Depot'] 
  },
  purchasePrice: { type: Number, required: true },
  rentPricePerMonth: { type: Number, required: true },
  storageCapacityBonus: { type: Number, default: 0 },
  passiveIncomePerDay: { type: Number, default: 0 },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    default: null 
  },
  isRented: { type: Boolean, default: false },
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    default: null 
  },
  leaseExpiresAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
