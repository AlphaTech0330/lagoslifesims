const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PlayerSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isAdmin: { 
    type: Boolean, 
    default: false 
  },
  currentLocation: { 
    type: String, 
    default: 'Lagos' 
  },
  cash: { 
    type: Number, 
    default: 250000 
  },
  energy: { 
    type: Number, 
    default: 100 
  },
  totalTradesCompleted: { 
    type: Number, 
    default: 0 
  },
  extraStorageCapacity: { 
    type: Number, 
    default: 0 
  },
  inventory: [{
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item' 
    },
    quantity: { 
      type: Number, 
      default: 0 
    }
  }]
}, { timestamps: true });

// Password hashing middleware before save
PlayerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
PlayerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Player', PlayerSchema);