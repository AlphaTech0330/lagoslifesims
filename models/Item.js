const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  category: { 
    type: String, 
    required: true, 
    enum: ['Raw Food', 'Manufactured', 'Luxury/Art', 'Tech'] 
  },
  basePrice: { 
    type: Number, 
    required: true 
  },
  regionalMultipliers: {
    Lagos: { type: Number, default: 1.0 },
    Ibadan: { type: Number, default: 1.0 },
    Ogun: { type: Number, default: 1.0 },
    Osun: { type: Number, default: 1.0 },
    Kwara: { type: Number, default: 1.0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
