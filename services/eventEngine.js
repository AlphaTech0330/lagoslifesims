/**
 * Highway Event Pool for Southwestern Transit Routes
 */
const HIGHWAY_EVENTS = [
  {
    id: 'VIO_CHECKPOINT',
    title: 'VIO / Vehicle Inspection Officers',
    description: 'VIO officers flag down your haulage truck to inspect roadworthiness documents.',
    probability: 0.35, // 35% chance on major highways
    affectedStates: ['Lagos', 'Ogun', 'Ibadan'],
    resolve: (truck, player) => {
      // If player has upgraded truck condition or bribe cash
      const fineAmount = 15000;
      if (player.cash >= fineAmount) {
        player.cash -= fineAmount;
        return {
          triggered: true,
          type: 'COST_PENALTY',
          message: 'VIO fined you ₦15,000 for roadworthiness compliance on the expressway.',
          cashDeducted: fineAmount,
          timeDelayHours: 0.5
        };
      }
      return {
        triggered: true,
        type: 'DELAY_PENALTY',
        message: 'Unable to pay fine immediately. Truck detained for 2 hours.',
        timeDelayHours: 2.0
      };
    }
  },
  {
    id: 'TRAFFIC_GRIDLOCK',
    title: 'Long Bridge / Expressway Traffic Gridlock',
    description: 'Heavy tanker breakdown causes severe traffic gridlock along the corridor.',
    probability: 0.40,
    affectedStates: ['Lagos', 'Ogun'],
    resolve: (truck, player) => {
      const extraFuel = 5000;
      player.cash = Math.max(0, player.cash - extraFuel);
      return {
        triggered: true,
        type: 'TRAFFIC_DELAY',
        message: 'Trapped in a 3-hour gridlock. Consumed extra ₦5,000 in idle fuel.',
        timeDelayHours: 3.0,
        cashDeducted: extraFuel
      };
    }
  },
  {
    id: 'TRANSPORT_UNION_LEVY',
    title: 'Local Transport Union Toll',
    description: 'Union officials stop haulage vehicles at the state boundary entry hub.',
    probability: 0.30,
    affectedStates: ['Ibadan', 'Osun', 'Kwara'],
    resolve: (truck, player) => {
      const unionFee = 8000;
      player.cash = Math.max(0, player.cash - unionFee);
      return {
        triggered: true,
        type: 'UNION_TOLL',
        message: 'Paid ₦8,000 union haulage toll sticker at state boundary.',
        timeDelayHours: 0.25,
        cashDeducted: unionFee
      };
    }
  }
];

/**
 * Process event generation during travel execution
 */
exports.processHighwayEvents = (origin, destination, truck, player) => {
  const activeEvents = [];
  
  // Filter events applicable to destination or origin states
  const eligibleEvents = HIGHWAY_EVENTS.filter(evt => 
    evt.affectedStates.includes(origin) || evt.affectedStates.includes(destination)
  );

  for (const event of eligibleEvents) {
    if (Math.random() < event.probability) {
      const outcome = event.resolve(truck, player);
      activeEvents.push({
        id: event.id,
        title: event.title,
        description: event.description,
        ...outcome
      });
      
      // Stop after 1 major event per trip to avoid punishing the player unfairly
      break; 
    }
  }

  return activeEvents;
};