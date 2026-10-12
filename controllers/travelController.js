const Truck = require('../models/Truck');
const Cargo = require('../models/Cargo');
const Route = require('../models/Route');

/**
 * Helper to calculate total current payload in kilograms/units
 */
const calculateCurrentPayload = (inventory) => {
  return inventory.reduce((total, item) => total + (item.weight * item.quantity), 0);
};

exports.initiateTravel = async (req, res) => {
  try {
    const { truckId, routeId } = req.body;

    const truck = await Truck.findById(truckId).populate('inventory.item');
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found.' });
    }

    if (truck.status === 'IN_TRANSIT') {
      return res.status(400).json({ success: false, message: 'Truck is already in transit.' });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    // --- Inventory Capacity Check ---
    const totalPayloadWeight = calculateCurrentPayload(truck.inventory);

    if (totalPayloadWeight > truck.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Overweight capacity exceeded! Current payload (${totalPayloadWeight}kg) exceeds truck max capacity (${truck.maxCapacity}kg).`,
        data: {
          currentPayload: totalPayloadWeight,
          maxCapacity: truck.maxCapacity,
          overweightBy: totalPayloadWeight - truck.maxCapacity
        }
      });
    }

    // Update truck status to in-transit
    truck.status = 'IN_TRANSIT';
    truck.currentRoute = route._id;
    truck.departureTime = new Date();
    await truck.save();

    return res.status(200).json({
      success: true,
      message: 'Travel initiated successfully.',
      data: {
        truckId: truck._id,
        route: route.name,
        payloadWeight: totalPayloadWeight,
        capacityRemaining: truck.maxCapacity - totalPayloadWeight
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};