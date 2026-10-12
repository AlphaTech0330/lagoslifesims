const Truck = require('../models/Truck');
const Item = require('../models/Item');
const User = require('../models/User');

// Upgrade tier configuration
const UPGRADE_MODELS = {
  CAPACITY: {
    TIER_1: { name: 'Reinforced Bed', capacityIncrease: 500, cost: 2500 },
    TIER_2: { name: 'Extended Chassis', capacityIncrease: 1200, cost: 6000 },
    TIER_3: { name: 'Heavy Duty Axle Set', capacityIncrease: 2500, cost: 14000 }
  },
  ENGINE: {
    TIER_1: { name: 'ECU Re-map', speedIncrease: 10, fuelEfficiency: 0.05, cost: 3000 },
    TIER_2: { name: 'Turbocharger Kit', speedIncrease: 25, fuelEfficiency: 0.10, cost: 8500 }
  }
};

/**
 * Buy Goods and Add to Truck Inventory (with Capacity Verification)
 */
exports.buyCargo = async (req, res) => {
  try {
    const { userId, truckId, itemId, quantity } = req.body;

    const truck = await Truck.findById(truckId);
    const item = await Item.findById(itemId);
    const user = await User.findById(userId);

    if (!truck || !item || !user) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const totalCost = item.price * quantity;
    if (user.balance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient funds.' });
    }

    // Calculate weight addition
    const addedWeight = item.weight * quantity;
    const currentPayload = truck.inventory.reduce((acc, curr) => acc + (curr.weight * curr.quantity), 0);

    if (currentPayload + addedWeight > truck.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Cargo purchase rejected: Exceeds truck maximum inventory capacity.',
        data: {
          currentPayload,
          requestedWeight: addedWeight,
          maxCapacity: truck.maxCapacity,
          availableCapacity: truck.maxCapacity - currentPayload
        }
      });
    }

    // Deduct user balance
    user.balance -= totalCost;
    await user.save();

    // Add item to truck inventory
    const existingIndex = truck.inventory.findIndex(i => i.item.toString() === itemId);
    if (existingIndex > -1) {
      truck.inventory[existingIndex].quantity += quantity;
    } else {
      truck.inventory.push({ item: itemId, weight: item.weight, quantity });
    }

    await truck.save();

    return res.status(200).json({
      success: true,
      message: 'Cargo purchased and loaded.',
      data: { truckInventory: truck.inventory, newBalance: user.balance }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Purchase Vehicle Upgrades (Capacity, Speed, Efficiency)
 */
exports.upgradeVehicle = async (req, res) => {
  try {
    const { userId, truckId, upgradeCategory, upgradeTier } = req.body;

    const truck = await Truck.findById(truckId);
    const user = await User.findById(userId);

    if (!truck || !user) {
      return res.status(404).json({ success: false, message: 'Truck or User not found.' });
    }

    const upgradeConfig = UPGRADE_MODELS[upgradeCategory]?.[upgradeTier];
    if (!upgradeConfig) {
      return res.status(400).json({ success: false, message: 'Invalid upgrade selection.' });
    }

    if (user.balance < upgradeConfig.cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds for upgrade. Cost: $${upgradeConfig.cost}`
      });
    }

    // Check if upgrade already applied
    if (truck.installedUpgrades?.includes(`${upgradeCategory}_${upgradeTier}`)) {
      return res.status(400).json({ success: false, message: 'Upgrade already installed on this truck.' });
    }

    // Apply funds deduction
    user.balance -= upgradeConfig.cost;
    await user.save();

    // Apply upgrade mutations to Truck Model
    if (upgradeCategory === 'CAPACITY') {
      truck.maxCapacity += upgradeConfig.capacityIncrease;
    } else if (upgradeCategory === 'ENGINE') {
      truck.topSpeed = (truck.topSpeed || 80) + upgradeConfig.speedIncrease;
      truck.fuelEfficiency = (truck.fuelEfficiency || 1.0) + upgradeConfig.fuelEfficiency;
    }

    truck.installedUpgrades.push(`${upgradeCategory}_${upgradeTier}`);
    await truck.save();

    return res.status(200).json({
      success:true,
      message: `Successfully upgraded truck with ${upgradeConfig.name}!`,
      data: {
        truckId: truck._id,
        newMaxCapacity: truck.maxCapacity,
        topSpeed: truck.topSpeed,
        installedUpgrades: truck.installedUpgrades,
        remainingBalance: user.balance
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};