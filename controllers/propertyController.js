const Property = require('../models/Property');
const Player = require('../models/Player');

exports.getProperties = async (req, res) => {
  try {
    const { state } = req.query;
    const filter = state ? { state } : {};
    const properties = await Property.find(filter)
      .populate('owner', 'username')
      .populate('tenant', 'username');

    res.json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.buyProperty = async (req, res) => {
  const { propertyId } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.owner) {
      return res.status(400).json({ success: false, message: 'Property is already owned' });
    }

    const player = await Player.findById(req.user._id);
    if (player.cash < property.purchasePrice) {
      return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    player.cash -= property.purchasePrice;
    player.propertiesOwned.push(property._id);
    player.extraStorageCapacity += property.storageCapacityBonus;
    player.netWorth += property.purchasePrice;

    property.owner = player._id;

    await player.save();
    await property.save();

    res.json({
      success: true,
      message: `Successfully purchased ${property.title}`,
      remainingCash: player.cash,
      property
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.leaseProperty = async (req, res) => {
  const { propertyId } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.isRented) {
      return res.status(400).json({ success: false, message: 'Property is currently leased' });
    }

    const player = await Player.findById(req.user._id);
    if (player.cash < property.rentPricePerMonth) {
      return res.status(400).json({ success: false, message: 'Insufficient funds for rent deposit' });
    }

    player.cash -= property.rentPricePerMonth;
    
    const leaseExpiresAt = new Date();
    leaseExpiresAt.setDate(leaseExpiresAt.getDate() + 30);

    player.propertiesRented.push({ propertyId: property._id, leaseExpiresAt });
    player.extraStorageCapacity += property.storageCapacityBonus;

    property.isRented = true;
    property.tenant = player._id;
    property.leaseExpiresAt = leaseExpiresAt;

    await player.save();
    await property.save();

    res.json({
      success: true,
      message: `Leased ${property.title} for 30 days`,
      leaseExpiresAt,
      remainingCash: player.cash
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};