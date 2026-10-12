const { io } = require('socket.io-client');

// Connect to the Socket.io server running on port 5000
const socket = io('http://localhost:5000');

// 1. Connection Event
socket.on('connect', () => {
  console.log(`\x1b[32m[Connected]\x1b[0m Client ID: ${socket.id}`);

  // Join the 'Lagos' market room stream
  const targetRegion = 'Lagos';
  console.log(`[Joining Room] Subscribing to ${targetRegion} market feed...`);
  socket.emit('JOIN_STATE_MARKET', targetRegion);
});

// 2. Listen for Real-Time Market Ticks
socket.on('MARKET_TICK_UPDATE', (data) => {
  console.log('\n\x1b[33m⚡ Real-Time Market Price Tick Received:\x1b[0m');
  console.table(data);
});

// 3. Listen for Regional Market Events (e.g., fuel scarcity, harvest surges)
socket.on('MARKET_EVENT', (eventData) => {
  console.log('\n\x1b[31m🚨 Regional Event Alert:\x1b[0m', eventData);
});

// 4. Disconnect Handling
socket.on('disconnect', () => {
  console.log('\x1b[31m[Disconnected]\x1b[0m Connection closed.');
});