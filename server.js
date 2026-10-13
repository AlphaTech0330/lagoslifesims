const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const factionRoutes = require('./routes/factionRoutes');
const electionRoutes = require('./routes/electionRoutes');

// Model & Service Imports
const Item = require('./models/Item');
const ChatMessage = require('./models/ChatMessage');
const { initCronJobs } = require('./services/cronService');

const app = express();
const server = http.createServer(app);

// 1. Core Middleware
const CLIENT_URL = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 2. Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io on app instance for controller access
app.set('socketio', io);

// 3. Keep-Alive Route (UptimeRobot Health Check)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 4. Base API Endpoint
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
app.use('/api/elections', electionRoutes);

// 6. Initialize Scheduled Cron Jobs
initCronJobs(io);

// 7. Socket Handlers (Regional Markets & Chat Rooms)
io.on('connection', (socket) => {
  console.log(`⚡ Player connected to socket stream: ${socket.id}`);

  // Join regional market room
  socket.on('JOIN_STATE_MARKET', (stateName) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(stateName);
    console.log(`Player ${socket.id} joined market room: ${stateName}`);
  });

  // Join Chat Channel
  socket.on('JOIN_CHAT_CHANNEL', async ({ channel }) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(channel);

    try {
      const recentMessages = await ChatMessage.find({ channel })
        .sort({ createdAt: -1 })
        .limit(30);

      socket.emit('CHAT_HISTORY', recentMessages.reverse());
    } catch (err) {
      console.error('Error fetching chat history:', err.message);
    }
  });

  // Broadcast chat message
  socket.on('SEND_CHAT_MESSAGE', async ({ playerId, username, channel, text }) => {
    if (!text || !text.trim()) return;

    try {
      const newMessage = await ChatMessage.create({
        sender: playerId,
        username,
        channel,
        text: text.trim()
      });

      io.to(channel).emit('NEW_CHAT_MESSAGE', newMessage);
    } catch (err) {
      console.error('Error saving chat message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected from socket: ${socket.id}`);
  });
});

// 8. Live Market Price Fluctuation Tick Service (Every 30 Seconds)
setInterval(async () => {
  try {
    const items = await Item.find({});
    if (!items.length) return;

    const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

    for (const state of REGIONS) {
      const updatedMarket = items.map((item) => {
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

      io.to(state).emit('MARKET_TICK_UPDATE', updatedMarket);
    }
  } catch (err) {
    console.error('Error broadcasting market tick updates:', err.message);
  }
}, 30000);

// 9. Database Connection & Server Startup
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