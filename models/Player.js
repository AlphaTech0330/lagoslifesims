const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // --- Account & Auth Credentials ---
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },

  // --- Location & Core Stats ---
  currentLocation: { 
    type: String, 
    enum: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'], 
    default: 'Lagos' 
  },
  cash: { 
    type: Number, 
    default: 50000 // Liquid Naira
  },
  bankBalance: { 
    type: Number, 
    default: 0 
  },
  energy: { 
    type: Number, 
    default: 100, 
    min: 0, 
    max: 100 
  },

  // --- Regional Reputation ---
  reputation: {
    lagosTech: { type: Number, default: 0 },
    ibadanTrade: { type: Number, default: 0 },
    ogunIndustry: { type: Number, default: 0 },
    osunCulture: { type: Number, default: 0 },
    kwaraCommerce: { type: Number, default: 0 }
  },

  // --- Inventory & Warehouse Storage ---
  inventory: [{
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item',
      required: true 
    },
    quantity: { 
      type: Number, 
      default: 0, 
      min: 0 
    }
  }],
  extraStorageCapacity: { 
    type: Number, 
    default: 0 // Additional cargo capacity (in kg) provided by active warehouses
  },

  // --- Real Estate & Properties ---
  propertiesOwned: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property' 
  }],
  propertiesRented: [{
    propertyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Property' 
    },
    leaseExpiresAt: { type: Date }
  }],

  // --- Transport Union Faction ---
  faction: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Faction', 
    default: null 
  },
  factionRole: { 
    type: String, 
    enum: ['Leader', 'Officer', 'Member', 'None'], 
    default: 'None' 
  },

  // --- Leaderboard & Performance Metrics ---
  netWorth: { 
    type: Number, 
    default: 50000 // Aggregated liquid cash + property valuation
  },
  totalTradesCompleted: { 
    type: Number, 
    default: 0 
  },
  totalCargoHauledKg: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Helper Virtual: Dynamically calculate total effective storage capacity
playerSchema.virtual('totalCapacityKg').get(function () {
  const baseCapacity = 5000; // Base haulage capacity
  return baseCapacity + this.extraStorageCapacity;
});

module.exports = mongoose.model('Player', playerSchema);