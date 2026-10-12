const http = require('http');
const { Server } = require('socket.io');

// Base regional price multipliers
const REGIONAL_BASE_MULTIPLIERS = {
  Lagos: 1.8,
  Ibadan: 1.2,
  Ogun: 1.0,
  Osun: 0.8,
  Kwara: 0.6
};

const COMMODITIES = [
  { id: 'item_1', name: 'Kwara Yam Tubers', category: 'Raw Food', basePrice: 1500 },
  { id: 'item_2', name: 'Osogbo Adire Textile', category: 'Luxury/Art', basePrice: 12000 },
  { id: 'item_3', name: 'Agbara Manufactured Plastics', category: 'Manufactured', basePrice: 4500 },
  { id: 'item_4', name: 'Ibadan Farm Eggs (Crate)', category: 'Raw Food', basePrice: 3200 },
  { id: 'item_5', name: 'Lagos Tech Hardware Parts', category: 'Tech', basePrice: 85000 }
];

const STATES = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

// In-memory market price cache
let currentMarketState = {};

/**
 * Generate market price fluctuations (-12% to +12%)
 */
const updateMarketPrices = () => {
  const updatedState = {};

  STATES.forEach(state => {
    const baseMultiplier = REGIONAL_BASE_MULTIPLIERS[state];

    updatedState[state] = COMMODITIES.map(item => {
      // Fluctuate multiplier randomly
      const fluctuation = (Math.random() * 0.24) - 0.12; 
      const activeMultiplier = Math.max(0.3, Number((baseMultiplier + fluctuation).toFixed(2)));
      const localPrice = Math.round(item.basePrice * activeMultiplier);

      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        basePrice: item.basePrice,
        localPrice,
        multiplier: activeMultiplier,
        trend: fluctuation >= 0 ? 'UP' : 'DOWN',
        priceChangePct: Number((fluctuation * 100).toFixed(1))
      };
    });
  });

  currentMarketState = updatedState;
  return updatedState;
};

// Seed initial prices
updateMarketPrices();

/**
 * Initialize Socket.io Server
 */
const initWebSocketServer = (expressApp) => {
  const server = http.createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: '*', // Set to your React/Next.js frontend URL in production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Connected: ${socket.id}`);

    // Send instant snapshot on connection
    socket.emit('MARKET_INIT', {
      timestamp: new Date(),
      markets: currentMarketState
    });

    // Player joins state-specific room (e.g. "Lagos")
    socket.on('JOIN_STATE_MARKET', (state) => {
      if (STATES.includes(state)) {
        socket.join(state);
        socket.emit('STATE_SNAPSHOT', {
          state,
          commodities: currentMarketState[state]
        });
      }
    });

    socket.on('LEAVE_STATE_MARKET', (state) => {
      socket.leave(state);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Disconnected: ${socket.id}`);
    });
  });

  // Broadcast market update every 3 minutes (180,000 ms)
  const BROADCAST_INTERVAL_MS = 3 * 60 * 1000;

  setInterval(() => {
    const newPrices = updateMarketPrices();
    const payload = {
      timestamp: new Date(),
      markets: newPrices
    };

    // 1. Global broadcast to all connected players
    io.emit('MARKET_TICK_UPDATE', payload);

    // 2. Room-specific broadcast for state subscribers
    STATES.forEach(state => {
      io.to(state).emit('STATE_PRICE_UPDATE', {
        state,
        timestamp: payload.timestamp,
        commodities: newPrices[state]
      });
    });

    console.log(`[WebSocket] Broadcasted market tick at ${new Date().toISOString()}`);
  }, BROADCAST_INTERVAL_MS);

  return server;
};

module.exports = initWebSocketServer;