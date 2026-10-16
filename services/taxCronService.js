const cron = require('node-cron');
const Election = require('../models/Election');
const TradeContract = require('../models/TradeContract');
const Player = require('../models/Player');

/**
 * Weekly Automated Union Tax Reserve Distribution Service
 * Cron Schedule: Every Sunday at Midnight ('0 0 * * 0')
 */
exports.initTaxCronJob = (io) => {
  // Scheduled for midnight every Sunday (Server Time)
  cron.schedule('0 0 * * 0', async () => {
    console.log('🏛️ Running Automated Weekly Union Tax Reserve Payouts...');

    const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

    for (const region of REGIONS) {
      try {
        // 1. Locate the active elected Union Chairman for the state
        const activeElection = await Election.findOne({ region, phase: 'CLOSED' });
        if (!activeElection || !activeElection.winner) {
          console.log(`ℹ️ No elected Union Chairman for ${region}. Skipping tax distribution.`);
          continue;
        }

        const chairman = await Player.findById(activeElection.winner);
        if (!chairman) continue;

        // 2. Fetch all completed trades in this region that haven't been processed in prior payouts
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        const recentTrades = await TradeContract.find({
          region,
          status: 'COMPLETED',
          updatedAt: { $gte: startOfWeek }
        });

        if (recentTrades.length === 0) {
          console.log(`ℹ️ No trade activity in ${region} for this week.`);
          continue;
        }

        // 3. Calculate accumulated 2% tax reserve
        const grossVolume = recentTrades.reduce((sum, t) => sum + (t.quantity * t.pricePerUnit), 0);
        const UNION_TAX_RATE = 0.02;
        const totalTaxPayout = Math.round(grossVolume * UNION_TAX_RATE);

        if (totalTaxPayout <= 0) continue;

        // 4. Deposit accumulated reserve into Chairman's account
        chairman.cash += totalTaxPayout;
        await chairman.save();

        console.log(`✅ Paid ₦${totalTaxPayout.toLocaleString()} in Union Tax Reserves to ${region} Chairman (${chairman.username}).`);

        // 5. Emit real-time Socket.io notification to the Chairman if connected
        if (io) {
          const payoutEventKey = `COMMISSION_PAYOUT_${chairman._id}`;
          io.emit(payoutEventKey, {
            amount: totalTaxPayout,
            region,
            message: `Weekly Union Tax Stipend: You received ₦${totalTaxPayout.toLocaleString()} from ${region} trade reserves!`
          });
        }
      } catch (err) {
        console.error(`❌ Error executing tax cron payout for ${region}:`, err.message);
      }
    }
  });

  console.log('⏰ Weekly Union Tax Reserve Cron Engine initialized.');
};