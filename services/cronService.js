const cron = require('node-cron');
const Property = require('../models/Property');
const Player = require('../models/Player');
const Election = require('../models/Election');

/**
 * Rotates regional elections through REGISTRATION ➔ VOTING ➔ CLOSED ➔ NEW CYCLE
 */
const rotateRegionalElections = async (io) => {
  console.log('🗳️ Running weekly election phase rotation service...');

  const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

  try {
    for (const region of REGIONS) {
      // Find the most recent active election for this region
      let election = await Election.findOne({ region }).sort({ createdAt: -1 });

      // Seed an initial REGISTRATION cycle if no election exists
      if (!election) {
        election = await Election.create({
          region,
          title: `${region} Trade & Transport Union Election`,
          status: 'REGISTRATION',
          candidates: [],
          voters: []
        });
        console.log(`✨ Seeded new election cycle for ${region}`);
        continue;
      }

      // PHASE 1: REGISTRATION ➔ VOTING
      if (election.status === 'REGISTRATION') {
        election.status = 'VOTING';
        await election.save();
        console.log(`🗳️ ${region} election phase shifted to VOTING.`);

        if (io) {
          io.emit('ELECTION_PHASE_UPDATE', {
            region,
            status: 'VOTING',
            message: `Voting is now OPEN for the ${region} Union Chairman election!`
          });
        }
      } 
      // PHASE 2: VOTING ➔ CLOSED (Tally Votes & Declare Winner)
      else if (election.status === 'VOTING') {
        election.status = 'CLOSED';

        if (election.candidates.length > 0) {
          const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
          const winnerCandidate = sortedCandidates[0];

          election.winner = winnerCandidate.player;
          await election.save();

          const winnerPlayer = await Player.findById(winnerCandidate.player);
          const winnerName = winnerPlayer ? winnerPlayer.username : 'Elected Candidate';

          console.log(`👑 ${region} election CLOSED. Winner: ${winnerName} with ${winnerCandidate.votes} votes.`);

          if (io) {
            io.emit('ELECTION_PHASE_UPDATE', {
              region,
              status: 'CLOSED',
              winnerName,
              message: `🎉 ${winnerName} has been elected Union Chairman of ${region}!`
            });
          }
        } else {
          await election.save();
          console.log(`🔒 ${region} election CLOSED with no registered candidates.`);
        }

        // Seed next week's REGISTRATION election cycle for this region
        await Election.create({
          region,
          title: `${region} Trade & Transport Union Election`,
          status: 'REGISTRATION',
          candidates: [],
          voters: []
        });
        console.log(`🆕 Created new REGISTRATION cycle for ${region} for next week.`);
      } 
      // FALLBACK: If CLOSED without a new cycle, seed a new one
      else if (election.status === 'CLOSED') {
        await Election.create({
          region,
          title: `${region} Trade & Transport Union Election`,
          status: 'REGISTRATION',
          candidates: [],
          voters: []
        });
      }
    }
    console.log('✅ Weekly election rotation completed successfully.');
  } catch (err) {
    console.error('❌ Error executing election rotation cron job:', err.message);
  }
};

/**
 * Initializes scheduled background jobs for the game server.
 * @param {Object} io - Socket.io server instance
 */
const initCronJobs = (io) => {
  // 1. Daily Real Estate Passive Income Payouts (Every night at 00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily passive real estate income payout service...');
    try {
      const ownedProperties = await Property.find({ owner: { $ne: null } }).populate('owner');
      if (!ownedProperties.length) return;

      const earningsByPlayer = {};
      for (const property of ownedProperties) {
        const ownerId = property.owner._id ? property.owner._id.toString() : property.owner.toString();
        const income = property.passiveIncomePerDay || 0;
        if (income > 0) {
          earningsByPlayer[ownerId] = (earningsByPlayer[ownerId] || 0) + income;
        }
      }

      for (const [playerId, totalIncome] of Object.entries(earningsByPlayer)) {
        const player = await Player.findById(playerId);
        if (player) {
          player.cash += totalIncome;
          await player.save();

          if (io) {
            io.emit(`INCOME_PAYOUT_${playerId}`, {
              success: true,
              amount: totalIncome,
              newCashBalance: player.cash,
              message: `Daily Real Estate Income: ₦${totalIncome.toLocaleString()} deposited to your wallet!`
            });
          }
        }
      }
    } catch (err) {
      console.error('❌ Error executing daily payout cron job:', err.message);
    }
  });

  // 2. Weekly Union Election Rotation (Every Sunday at 00:00)
  cron.schedule('0 0 * * 0', async () => {
    await rotateRegionalElections(io);
  });
};

module.exports = { initCronJobs, rotateRegionalElections };