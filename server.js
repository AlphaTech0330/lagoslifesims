const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Service & Engine Imports
const { initMarketSimulation } = require('./services/marketEngine');
const { initCronJobs } = require('./services/cronService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const factionRoutes = require('./routes/factionRoutes');
const electionRoutes = require('./routes/electionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const tradeRoutes = require('./routes/tradeRoutes'); // P2P Escrow Trade Contracts

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Express Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// Attach Socket.io instance to Express app for controller emissions
app.set('socketio', io);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/southwest_hustle')
  .then(() => console.log('🍃 MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// API Route Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/factions', factionRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/trade-contracts', tradeRoutes); // Mounted P2P Trade Contracts

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  console.log(`⚡ Trader connected: ${socket.id}`);

  // Regional Market Room Registration
  socket.on('JOIN_STATE_MARKET', (stateName) => {
    socket.join(stateName);
    console.log(`Trader ${socket.id} joined ${stateName} market feed.`);
  });

  // Chat Room Registration
  socket.on('JOIN_CHAT_ROOM', (roomName) => {
    socket.join(roomName);
    console.log(`Trader ${socket.id} joined chat room: ${roomName}`);
  });

  // Chat Message Broadcast
  socket.on('SEND_CHAT_MESSAGE', async (data) => {
    io.to(data.room).emit('NEW_CHAT_MESSAGE', data);
  });

  socket.on('disconnect', () => {
    console.log(`Trader disconnected: ${socket.id}`);
  });
});

// Initialize Background Engines & Cron Jobs
initMarketSimulation(io);
initCronJobs(io);

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`🚀 Southwest Hustle Server active on port ${PORT}`);
});