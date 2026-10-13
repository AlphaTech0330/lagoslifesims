/**
 * Checkpoint inspection service for interstate corridors
 */

// Define contraband / regulated items
const REGULATED_ITEMS = ['Untagged Teak Timber', 'Contraband Fuel', 'Unprocessed Cocoa'];

// State corridor risk multipliers
const CORRIDOR_RISKS = {
  Lagos: 0.35,  // 35% chance of checkpoint (High police/customs presence)
  Ogun: 0.25,   // 25% chance (Border corridor)
  Ibadan: 0.20, // 20% chance
  Osun: 0.15,   // 15% chance
  Kwara: 0.10   // 10% chance
};

/**
 * Triggers a random inspection check when traveling
 */
exports.checkInterstateCheckpoint = (destinationState, inventory) => {
  const riskChance = CORRIDOR_RISKS[destinationState] || 0.15;
  const roll = Math.random();

  // If roll is higher than risk chance, no checkpoint triggered
  if (roll > riskChance) {
    return { triggered: false };
  }

  // Find if player is carrying any regulated or contraband items
  const illegalGoods = inventory.filter((inv) => {
    const name = inv.itemId?.name || '';
    return REGULATED_ITEMS.some((regulated) => name.toLowerCase().includes(regulated.toLowerCase()));
  });

  const hasIllegalGoods = illegalGoods.length > 0;
  const bribeAmount = hasIllegalGoods ? 25000 : 5000; // Higher bribe if actually carrying contraband

  return {
    triggered: true,
    location: `${destinationState} Highway Checkpoint`,
    hasIllegalGoods,
    illegalGoods,
    bribeAmount,
    message: hasIllegalGoods
      ? `🚨 Joint Border Patrol checkpoint ahead! Officers suspect illicit cargo in your truck bed.`
      : `👮 Routine Union & Highway Patrol stop. They are requesting paperwork and a road-tax token.`
  };
};