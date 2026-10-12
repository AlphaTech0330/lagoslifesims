import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useMarketFeed = (currentState) => {
  const [marketData, setMarketData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    // Receive initial snapshot
    socket.on('MARKET_INIT', (data) => {
      setMarketData(data.markets);
      setLastUpdated(data.timestamp);
    });

    // Join room for player's current location
    if (currentState) {
      socket.emit('JOIN_STATE_MARKET', currentState);
    }

    // Handle live price tick updates
    socket.on('MARKET_TICK_UPDATE', (data) => {
      setMarketData(data.markets);
      setLastUpdated(data.timestamp);
    });

    return () => {
      if (currentState) {
        socket.emit('LEAVE_STATE_MARKET', currentState);
      }
      socket.disconnect();
    };
  }, [currentState]);

  return { marketData, lastUpdated };
};