const Player = require('../models/Player');

// Available Vehicle Upgrades Catalog
const UPGRADE_CATALOG = {
  REINFORCED_TIRES: {
    id: 'REINFORCED_TIRES',
    name: 'Reinforced Heavy-Duty Tires',
    type: 'TIRES',
    cost: 85000,
    breakdownReductionPct: 0.50, // 50% lower breakdown risk
    fuelCostDiscountPct: 0,
    storageBonus: 0,
    description: 'Puncture-resistant tread that mitigates pothole blowouts and flat tires on rough roads.'
  },
  AUXILIARY_FUEL_TANK: {
    id: 'AUXILIARY_FUEL_TANK',
    name: 'Dual Auxiliary Fuel Tank',
    type: 'FUEL_TANK',
    cost: 120000,
    breakdownReductionPct: 0,
    fuelCostDiscountPct: 0.30, // 30% lower travel fuel cost
    storageBonus: 0,
    description: 'Bypasses regional fuel scarcity markups and cuts standard travel fuel expense by 30%.'
  },
  HEAVY_DUTY_RADIATOR: {
    id: 'HEAVY_DUTY_RADIATOR',
    name: 'Tropical Heavy-Duty Radiator',
    type: 'COOLING',
    cost: 65000,
    breakdownReductionPct: 0.35, // 35% lower breakdown risk
    fuelCostDiscountPct: 0,
    storageBonus: 0,
    description: 'Prevents engine overheating and coolant failure during severe heatwaves and long drives.'
  },
  EXPANDED_CARGO_BAY: {
    id: 'EXPANDED_CARGO_BAY',
    name: 'Reinforced Metal Cargo Bed',
    type: 'CARGO_BAY',
    cost: 150000,
    breakdownReductionPct: 0,
    fuelCostDiscountPct: 0,
    storageBonus: 50, // +50 Inventory Capacity
    description: 'Welded steel side-boards expanding total payload capacity by 50 additional units.'
  }
};

// GET /api/vehicle/upgrades
exports.getAvailableUpgrades = async (req, res) => {
  try {
    const player = await Player.findById(req.user._id);
    const installedIds = player.vehicle.installedUpgrades.map(u => u.upgradeId);

    const catalog = Object.values(UPGRADE_CATALOG).map(upgrade => ({
      ...upgrade,
      isInstalled: installedIds.includes(upgrade.id)
    }));

    res.json({
      success: true,
      vehicle: player.vehicle,
      upgrades: catalog
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/vehicle/purchase-upgrade
exports.purchaseUpgrade = async (req, res) => {
  const { upgradeId } = req.body;

  try {
    const upgrade = UPGRADE_CATALOG[upgradeId];
    if (!upgrade) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle upgrade selected.' });
    }

    const player = await Player.findById(req.user._id);

    // Check if upgrade is already installed
    const alreadyInstalled = player.vehicle.installedUpgrades.some(u => u.upgradeId === upgradeId);
    if (alreadyInstalled) {
      return res.status(400).json({ success: false, message: 'Upgrade already installed on your vehicle.' });
    }

    // Check funds
    if (player.cash < upgrade.cost) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Upgrade costs ₦${upgrade.cost.toLocaleString()}` 
      });
    }

    // Deduct cash & install upgrade
    player.cash -= upgrade.cost;
    player.vehicle.installedUpgrades.push({
      upgradeId: upgrade.id,
      name: upgrade.name,
      type: upgrade.type,
      breakdownReductionPct: upgrade.breakdownReductionPct,
      fuelCostDiscountPct: upgrade.fuelCostDiscountPct,
      storageBonus: upgrade.storageBonus
    });

    if (upgrade.storageBonus > 0) {
      player.vehicle.extraStorage += upgrade.storageBonus;
    }

    await player.save();

    res.json({
      success: true,
      message: `Successfully installed ${upgrade.name}!`,
      remainingCash: player.cash,
      vehicle: player.vehicle
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};