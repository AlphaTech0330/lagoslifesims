const Item = require('../models/Item');
const Player = require('../models/Player');
const { checkInterstateCheckpoint } = require('../services/checkpointService');

exports.getMarketPrices = async (req, res) => {
  try {
    const player = await Player.findById(req.user._id);
    const items = await Item.find({});

    const currentLocation = player ? player.currentLocation : 'Lagos';

    const marketData = items.map((item) => {
      const multiplier = item.regionalMultipliers[currentLocation] || 1.0;
      const localPrice = Math.round(item.basePrice * multiplier);

      return {
        _id: item._id,
        name: item.name,
        category: item.category,
        basePrice: item.basePrice,
        localPrice,
        multiplier
      };
    });

    res.json({
      success: true,
      location: currentLocation,
      market: marketData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.travel = async (req, res) => {
  const { destinationState, resolveCheckpoint, action } = req.body;
  const TRAVEL_COST = 15000;
  const ENERGY_COST = 20;

  try {
    const player = await Player.findById(req.user._id).populate('inventory.itemId');

    if (player.currentLocation === destinationState) {
      return res.status(400).json({ success: false, message: 'You are already in this state.' });
    }

    if (player.cash < TRAVEL_COST) {
      return res.status(400).json({ success: false, message: 'Insufficient cash for highway tolls and fuel.' });
    }

    if (player.energy < ENERGY_COST) {
      return res.status(400).json({ success: false, message: 'Not enough energy to travel. Rest first!' });
    }

    // --- CHECKPOINT INTERACTION RESOLUTION ---
    if (resolveCheckpoint) {
      if (action === 'BRIBE') {
        const bribeCost = req.body.bribeAmount || 10000;
        if (player.cash < bribeCost) {
          return res.status(400).json({ success: false, message: 'Not enough cash to settle the checkpoint officers!' });
        }
        player.cash -= bribeCost;
      } else if (action === 'SURRENDER') {
        // Remove contraband and regulated items from inventory
        const REGULATED = ['Untagged Teak Timber', 'Contraband Fuel', 'Unprocessed Cocoa'];
        player.inventory = player.inventory.filter((inv) => {
          const name = inv.itemId?.name || '';
          return !REGULATED.some((r) => name.toLowerCase().includes(r.toLowerCase()));
        });
      }

      // Finalize travel after resolving checkpoint
      player.cash -= TRAVEL_COST;
      player.energy -= ENERGY_COST;
      player.currentLocation = destinationState;
      await player.save();

      return res.json({
        success: true,
        checkpointResolved: true,
        message: action === 'BRIBE' 
          ? `Settled the officers and proceeded to ${destinationState}.` 
          : `Contraband surrendered, but allowed to proceed to ${destinationState}.`,
        currentLocation: player.currentLocation,
        remainingCash: player.cash,
        remainingEnergy: player.energy,
        inventory: player.inventory
      });
    }

    // --- TRIGGER RANDOM CHECKPOINT CHECK ---
    const checkpoint = checkInterstateCheckpoint(destinationState, player.inventory);

    if (checkpoint.triggered) {
      return res.json({
        success: true,
        checkpointRequired: true,
        checkpointData: checkpoint,
        destinationState
      });
    }

    // Normal travel if no checkpoint was triggered
    player.cash -= TRAVEL_COST;
    player.energy -= ENERGY_COST;
    player.currentLocation = destinationState;
    await player.save();

    res.json({
      success: true,
      message: `Traveled safely to ${destinationState}`,
      currentLocation: player.currentLocation,
      remainingCash: player.cash,
      remainingEnergy: player.energy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.buyItem = async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    const player = await Player.findById(req.user._id);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const multiplier = item.regionalMultipliers[player.currentLocation] || 1.0;
    const unitPrice = Math.round(item.basePrice * multiplier);
    const totalCost = unitPrice * quantity;

    if (player.cash < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient cash balance' });
    }

    // Check cargo storage limits
    const currentInventoryCount = player.inventory.reduce((sum, i) => sum + i.quantity, 0);
    const maxCapacity = 100 + (player.extraStorageCapacity || 0);

    if (currentInventoryCount + quantity > maxCapacity) {
      return res.status(400).json({ success: false, message: 'Cargo payload capacity exceeded!' });
    }

    player.cash -= totalCost;

    const existingIndex = player.inventory.findIndex(
      (inv) => inv.itemId.toString() === itemId
    );

    if (existingIndex > -1) {
      player.inventory[existingIndex].quantity += quantity;
    } else {
      player.inventory.push({ itemId: item._id, quantity });
    }

    player.totalTradesCompleted += 1;
    await player.save();

    res.json({
      success: true,
      message: `Purchased ${quantity}x ${item.name} for ₦${totalCost.toLocaleString()}`,
      remainingCash: player.cash,
      inventory: player.inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sellItem = async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    const player = await Player.findById(req.user._id);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const invIndex = player.inventory.findIndex(
      (inv) => inv.itemId.toString() === itemId
    );

    if (invIndex === -1 || player.inventory[invIndex].quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient inventory quantity' });
    }

    const multiplier = item.regionalMultipliers[player.currentLocation] || 1.0;
    const unitPrice = Math.round(item.basePrice * multiplier);
    const totalPayout = unitPrice * quantity;

    player.cash += totalPayout;
    player.inventory[invIndex].quantity -= quantity;

    if (player.inventory[invIndex].quantity <= 0) {
      player.inventory.splice(invIndex, 1);
    }

    player.totalTradesCompleted += 1;
    await player.save();

    res.json({
      success: true,
      message: `Sold ${quantity}x ${item.name} for ₦${totalPayout.toLocaleString()}`,
      remainingCash: player.cash,
      inventory: player.inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};