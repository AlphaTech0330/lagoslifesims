const TradeContract = require('../models/TradeContract');
const Player = require('../models/Player');
const Item = require('../models/Item');
const Election = require('../models/Election');

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

      // Lock item in escrow
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

// POST /api/trade-contracts/fulfill - Fulfill an existing contract & pay Union Chairman Commission
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

    const grossTradeValue = contract.pricePerUnit * contract.quantity;
    const UNION_TAX_RATE = 0.02; // 2% Chairman Commission
    const unionTaxAmount = Math.round(grossTradeValue * UNION_TAX_RATE);
    const netPayoutToSeller = grossTradeValue - unionTaxAmount;

    // --- 1. PROCESS SELLER & BUYER BALANCES ---
    if (contract.type === 'SELL_ORDER') {
      if (buyer.cash < grossTradeValue) {
        return res.status(400).json({ success: false, message: 'Insufficient cash to fulfill this sell contract.' });
      }

      // Buyer pays full trade value, receives escrowed items
      buyer.cash -= grossTradeValue;
      const invIndex = buyer.inventory.findIndex(i => i.itemId.toString() === contract.item._id.toString());
      if (invIndex > -1) {
        buyer.inventory[invIndex].quantity += contract.quantity;
      } else {
        buyer.inventory.push({ itemId: contract.item._id, quantity: contract.quantity });
      }

      // Creator (Seller) receives net trade value after 2% Union tax deduction
      creator.cash += netPayoutToSeller;

      await buyer.save();
      await creator.save();
    } else if (contract.type === 'BUY_ORDER') {
      // Creator had locked gross trade value in escrow.
      // Seller (Buyer player fulfilling contract) delivers items and receives net trade value.
      const invIndex = buyer.inventory.findIndex(i => i.itemId.toString() === contract.item._id.toString());
      if (invIndex === -1 || buyer.inventory[invIndex].quantity < contract.quantity) {
        return res.status(400).json({ success: false, message: 'You do not have enough items to fulfill this buy order.' });
      }

      // Deduct items from fulfiller
      buyer.inventory[invIndex].quantity -= contract.quantity;
      if (buyer.inventory[invIndex].quantity <= 0) {
        buyer.inventory.splice(invIndex, 1);
      }
      buyer.cash += netPayoutToSeller;

      // Creator gets items
      const creatorInvIndex = creator.inventory.findIndex(i => i.itemId.toString() === contract.item._id.toString());
      if (creatorInvIndex > -1) {
        creator.inventory[creatorInvIndex].quantity += contract.quantity;
      } else {
        creator.inventory.push({ itemId: contract.item._id, quantity: contract.quantity });
      }

      await buyer.save();
      await creator.save();
    }

    // --- 2. CALCULATE & AWARD UNION CHAIRMAN COMMISSION ---
    let chairmanMessage = '';
    const activeElection = await Election.findOne({ region: contract.region, phase: 'CLOSED' });

    if (activeElection && activeElection.winner) {
      const chairman = await Player.findById(activeElection.winner);
      if (chairman) {
        chairman.cash += unionTaxAmount;
        await chairman.save();

        chairmanMessage = ` 🏛️ 2% Union Tax (₦${unionTaxAmount.toLocaleString()}) paid to ${contract.region} Union Chairman (${chairman.username}).`;

        // Socket.io Real-Time Notification to Union Chairman
        const io = req.app.get('socketio');
        if (io) {
          io.emit(`COMMISSION_PAYOUT_${chairman._id}`, {
            amount: unionTaxAmount,
            region: contract.region,
            message: `You earned a ₦${unionTaxAmount.toLocaleString()} Union Tax Commission on a P2P trade executed in ${contract.region}!`
          });
        }
      }
    }

    contract.status = 'COMPLETED';
    contract.fulfilledBy = buyer._id;
    await contract.save();

    res.json({
      success: true,
      message: `Successfully fulfilled trade contract!${chairmanMessage}`,
      remainingCash: buyer.cash,
      inventory: buyer.inventory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};