const { processHighwayEvents } = require('../services/eventEngine');
const Player = require('../models/Player');
const Truck = require('../models/Truck');

exports.attachHighwayEvents = async (req, res, next) => {
  // Execute after basic travel checks are validated
  const originalJson = res.json;

  res.json = async function (data) {
    if (res.statusCode === 200 && data.currentLocation) {
      try {
        const player = await Player.findById(req.user._id);
        const truck = await Truck.findOne({ _id: req.body.truckId });

        const eventsTriggered = processHighwayEvents(
          data.originState || 'Lagos',
          data.currentLocation,
          truck,
          player
        );

        if (eventsTriggered.length > 0) {
          // Accumulate extra delays or cost changes
          const totalDelayHours = eventsTriggered.reduce((acc, curr) => acc + (curr.timeDelayHours || 0), 0);
          
          await player.save();

          data.events = eventsTriggered;
          data.adjustedTravelHours = (data.travelHours || 0) + totalDelayHours;
          data.remainingCash = player.cash;
        }
      } catch (err) {
        console.error('Error applying highway events:', err);
      }
    }
    originalJson.call(this, data);
  };

  next();
};