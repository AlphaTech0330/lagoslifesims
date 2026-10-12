const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const factionRoutes = require('./routes/factionRoutes');

// Model Imports (for live market tick updates)
const Item = require('./models/Item');

const app = express();
const server = http.createServer(app);

// 1. CORS Configuration
const CLIENT_URL = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// 2. Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 3. Lightweight Health Check Endpoint (UptimeRobot Keep-Alive)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 4. Base API Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Southwestern Nigeria Life-Sim & Trade RPG API is active'
  });
});

// 5. API Route Declarations
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/factions', factionRoutes);

// 6. WebSocket Regional Room Subscriptions & Live Market Ticks
io.on('connection', (socket) => {
  console.log(`⚡ Player connected to market socket: ${socket.id}`);

  // Join regional market room (e.g., 'Lagos', 'Ibadan', 'Kwara')
  socket.on('JOIN_STATE_MARKET', (stateName) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(stateName);
    console.log(`Player ${socket.id} joined regional market room: ${stateName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected from socket: ${socket.id}`);
  });
});

// 7. Automated Live Market Price Fluctuation Tick Service
// Simulates price movements across Southwestern trade corridors every 30 seconds
setInterval(async () => {
  try {
    const items = await Item.find({});
    if (!items.length) return;

    const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

    for (const state of REGIONS) {
      const updatedMarket = items.map((item) => {
        // Random price fluctuation multiplier between 0.8x and 2.5x
        const randomFluctuation = (Math.random() * 0.4 - 0.2); // ±20% drift
        const currentMultiplier = item.regionalMultipliers[state] || 1.0;
        const newMultiplier = Math.max(0.7, Math.min(3.0, +(currentMultiplier + randomFluctuation).toFixed(2)));

        const localPrice = Math.round(item.basePrice * newMultiplier);

        return {
          _id: item._id,
          name: item.name,
          category: item.category,
          basePrice: item.basePrice,
          localPrice,
          multiplier: newMultiplier
        };
      });

      // Broadcast market update exclusively to players currently in that state room
      io.to(state).emit('MARKET_TICK_UPDATE', updatedMarket);
    }
  } catch (err) {
    console.error('Error broadcasting market tick updates:', err.message);
  }
}, 30000); // 30-second interval

// 8. Database Connection & Server Initialization
const PORT = process.env.PORT || 3030;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/southwest_hustle';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Game Server active on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });