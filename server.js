const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const factionRoutes = require('./routes/factionRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Global Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/factions', factionRoutes);

// Health Check / Root Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Southwestern Nigeria Life-Sim & Trade RPG API is active',
    regions: ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara']
  });
});

// Port Configuration
const PORT = process.env.PORT || 5000;

// Start HTTP & WebSocket Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Game Server active on port ${PORT}`);
});

// Initialize Socket.io for Real-Time Market Price Ticks
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Client connected to market stream: ${socket.id}`);

  socket.on('JOIN_STATE_MARKET', (stateName) => {
    socket.join(stateName);
    console.log(`Socket ${socket.id} joined market feed for ${stateName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export io instance for controllers/services if needed
app.set('socketio', io);