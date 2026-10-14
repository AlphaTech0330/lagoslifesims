const Item = require('../models/Item');

/**
 * Periodically updates local market prices for regional commodities
 */
exports.initMarketSimulation = (io) => {
  const TICK_INTERVAL_MS = 60000; // Fluctuate prices every 60 seconds

  setInterval(async () => {
    try {
      const items = await Item.find({});
      if (!items || items.length === 0) return;

      const updatedItems = [];

      for (const item of items) {
        // Random price movement (-5% to +5%)
        const fluctuation = (Math.random() * 0.1) - 0.05;
        const newBasePrice = Math.max(100, Math.round(item.basePrice * (1 + fluctuation)));

        item.basePrice = newBasePrice;
        await item.save();

        updatedItems.push({
          _id: item._id,
          name: item.name,
          category: item.category,
          basePrice: item.basePrice,
          regionalMultipliers: item.regionalMultipliers
        });
      }

      // Broadcast market updates via WebSockets
      if (io) {
        io.emit('MARKET_TICK_UPDATE', updatedItems);
      }
    } catch (err) {
      console.error('Market simulation tick error:', err.message);
    }
  }, TICK_INTERVAL_MS);
};