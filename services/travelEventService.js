/**
 * Expanded Interstate Travel Random Event Generator
 * Factor in Vehicle Upgrades for breakdown mitigation and fuel cost discounts.
 */

const REGIONAL_HAZARDS = {
  Lagos: { weather: 'Torrential Downpour / Highway Flooding', breakdownRisk: 0.15 },
  Ibadan: { weather: 'Heavy Rainstorm', breakdownRisk: 0.10 },
  Ogun: { weather: 'Severe Harmattan Haze', breakdownRisk: 0.12 },
  Osun: { weather: 'Pothole-Ridden Byway', breakdownRisk: 0.18 },
  Kwara: { weather: 'Fuel Shortage at Waystation', breakdownRisk: 0.14 }
};

/**
 * Evaluates random travel hazards during interstate transport
 */
exports.generateTravelEvent = (destinationState, player) => {
  const installed = player?.vehicle?.installedUpgrades || [];

  // 1. Calculate Aggregate Breakdown Mitigation
  const totalBreakdownProtection = installed.reduce((sum, u) => sum + (u.breakdownReductionPct || 0), 0);
  const baseBreakdownChance = 0.15;
  const effectiveBreakdownChance = Math.max(0.02, baseBreakdownChance * (1 - totalBreakdownProtection));

  const roll = Math.random();

  // --- 1. VEHICLE BREAKDOWN EVENT ---
  if (roll < effectiveBreakdownChance) {
    const repairCost = 20000;
    const energyPenalty = 15;

    return {
      triggered: true,
      type: 'BREAKDOWN',
      title: '🚚 Flat Tire & Radiator Overheat',
      message: `Your transport truck broke down along the ${destinationState} express corridor. Mechanics require roadside repair fees.`,
      options: [
        {
          action: 'REPAIR',
          label: 'Pay Roadside Mechanic',
          cost: repairCost,
          energyCost: 0,
          description: `Pay ₦${repairCost.toLocaleString()} to fix the truck bed.`
        },
        {
          action: 'PUSH_ON',
          label: 'Fix it Yourself (Exertion)',
          cost: 0,
          energyCost: energyPenalty,
          description: `Lose ${energyPenalty}% Energy pushing through manual repairs.`
        }
      ]
    };
  }

  // --- 2. FUEL SHORTAGE / SCARCITY EVENT (~12% Chance) ---
  if (roll >= 0.15 && roll < 0.27) {
    const hasAuxTank = installed.some(u => u.type === 'FUEL_TANK');
    const inflatedFuelCost = hasAuxTank ? 9000 : 18000;

    return {
      triggered: true,
      type: 'FUEL_SHORTAGE',
      title: '⛽ Regional Fuel Scarcity',
      message: hasAuxTank 
        ? `Fuel stations are out of petrol, but your Auxiliary Fuel Tank covers half the needed fuel supply!`
        : `Filling stations along the ${destinationState} route are out of petrol. Local black-market hawkers are selling fuel at surge prices.`,
      options: [
        {
          action: 'BUY_BLACK_MARKET',
          label: hasAuxTank ? 'Use Auxiliary Reserves + Partial Refuel' : 'Buy Black Market Fuel',
          cost: inflatedFuelCost,
          energyCost: 0,
          description: `Pay fuel cost (₦${inflatedFuelCost.toLocaleString()}).`
        },
        {
          action: 'WAIT_IT_OUT',
          label: 'Wait at Station for Tanker',
          cost: 0,
          energyCost: 25,
          description: 'Wait 3 hours for petrol tanker arrival (-25% Energy).'
        }
      ]
    };
  }

  // --- 3. WEATHER HAZARD EVENT (~10% Chance) ---
  if (roll >= 0.27 && roll < 0.37) {
    const hazard = REGIONAL_HAZARDS[destinationState] || { weather: 'Heavy Downpour', breakdownRisk: 0.1 };

    return {
      triggered: true,
      type: 'WEATHER',
      title: `⛈️ Weather Hazard: ${hazard.weather}`,
      message: `Extreme atmospheric conditions ahead on the way to ${destinationState}. Low visibility slows highway speed to a crawl.`,
      options: [
        {
          action: 'NAVIGATE_HAZARD',
          label: 'Cautiously Drive Through',
          cost: 5000,
          energyCost: 10,
          description: 'Pay ₦5,000 extra fuel & consume 10% Energy driving slowly.'
        },
        {
          action: 'PULL_OVER',
          label: 'Wait Out the Storm',
          cost: 0,
          energyCost: 20,
          description: 'Rest in cab until weather clears (-20% Energy).'
        }
      ]
    };
  }

  // No hazard triggered
  return { triggered: false };
};