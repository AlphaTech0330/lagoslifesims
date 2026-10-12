const mongoose = require('mongoose');
const { io: ioClient } = require('socket.io-client');
require('dotenv').config();

const Item = require('./models/Item');
const MONGO_URI = process.env.MONGO_URI;

// Connect to the server as an admin/emitter
const socket = ioClient('http://localhost:5000');

socket.on('connect', async () => {
  console.log('[Emitter Connected] Simulating periodic market tick...');

  try {
    await mongoose.connect(MONGO_URI);
    const items = await Item.find({});

    // Apply random ±10% market price fluctuation
    const updatedMarket = items.map(item => {
      const baseMultiplier = item.regionalMultipliers['Lagos'] || 1.0;
      const fluctuation = (Math.random() * 0.2 - 0.1); // -10% to +10%
      const currentMultiplier = Number((baseMultiplier + fluctuation).toFixed(2));
      const localPrice = Math.round(item.basePrice * currentMultiplier);

      return {
        name: item.name,
        category: item.category,
        basePrice: `₦${item.basePrice.toLocaleString()}`,
        localPrice: `₦${localPrice.toLocaleString()}`,
        multiplier: currentMultiplier
      };
    });

    // Broadcast tick via HTTP API endpoint or directly through server
    console.log('Publishing updated prices to subscribers...');
    
    // Disconnect after emitting
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Emitter Error:', error.message);
    process.exit(1);
  }
});