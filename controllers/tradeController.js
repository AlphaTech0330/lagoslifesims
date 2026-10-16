const TradeContract = require('../models/TradeContract');
const Player = require('../models/Player');
const Item = require('../models/Item');

// GET /api/trade-contracts/:region - List active market listings in current region
exports.getRegionalContracts = async (req, res) => {
  try {
    const { region } = req.params;
    const contracts = await TradeContract.find({ region, status: 'OPEN' })
      .populate('creator', 'username currentLocation')
      .populate('item', 'name category basePrice')
      .sort({ createdAt: -1 });

    res.json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/trade-contracts/create - Post a buy or sell contract
exports.createContract = async (req, res) => {
  const { type, itemId, quantity, pricePerUnit } = req.body;

  try {
    const player = await Player.findById(req.user._id);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (type === 'SELL_ORDER') {
      const invIndex = player.inventory.findIndex(inv => inv.itemId.toString() === itemId);
      if (invIndex === -1 || player.inventory[invIndex].quantity < quantity) {
        return res.status(400).json({ success: false, message: 'You do not own enough of this item to list for sale.' });
      }

      // Lock item in escrow (deduct from active inventory)
      player.inventory[invIndex].quantity -= quantity;
      if (player.inventory[invIndex].quantity <= 0) {
        player.inventory.splice(invIndex, 1);
      }
      await player.save();
    } else if (type === 'BUY_ORDER') {
      const totalCost = pricePerUnit * quantity;
      if (player.cash < totalCost) {
        return res.status(400).json({ success: false, message: 'Insufficient cash to fund this buy order in escrow.' });
      }

      // Lock cash in escrow
      player.cash -= totalCost;
      await player.save();
    }

    const contract = await TradeContract.create({
      creator: player._id,
      type,
      region: player.currentLocation,
      item: item._id,
      quantity,
      pricePerUnit
    });

    res.json({
      success: true,
      message: `${type === 'SELL_ORDER' ? 'Sell' : 'Buy'} contract posted to ${player.currentLocation} exchange!`,
      contract,
      remainingCash: player.cash,
      inventory: player.inventory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/trade-contracts/fulfill - Fulfill an existing contract
exports.fulfillContract = async (req, res) => {
  const { contractId } = req.body;

  try {
    const contract = await TradeContract.findById(contractId).populate('item');
    if (!contract || contract.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Trade contract is no longer active.' });
    }

    const buyer = await Player.findById(req.user._id);
    const creator = await Player.findById(contract.creator);

    if (creator._id.toString() === buyer._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot fulfill your own trade contract.' });
    }

    if (contract.type === 'SELL_ORDER') {
      const totalCost = contract.pricePerUnit * contract.quantity;
      if (buyer.cash < totalCost) {
        return res.status(400).json({ success: false, message: 'Insufficient cash to fulfill this sell contract.' });
      }

      // Buyer pays cash, receives escrowed items
      buyer.cash -= totalCost;
      const invIndex = buyer.inventory.findIndex(i => i.itemId.toString() === contract.item._id.toString());
      if (invIndex > -1) {
        buyer.inventory[invIndex].quantity += contract.quantity;
      } else {
        buyer.inventory.push({ itemId: contract.item._id, quantity: contract.quantity });
      }

      // Creator receives total cash payout
      creator.cash += totalCost;

      await buyer.save();
      await creator.save();
    }

    contract.status = 'COMPLETED';
    contract.fulfilledBy = buyer._id;
    await contract.save();

    res.json({
      success: true,
      message: `Successfully fulfilled trade contract with ${creator.username}!`,
      remainingCash: buyer.cash,
      inventory: buyer.inventory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};