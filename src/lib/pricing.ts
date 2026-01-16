import type { MagicQuality, MundaneWeapon, MundaneArmor, AnyBaseItem } from './types';
import { isWeapon, isArmor } from './dataset';

// ============================================
// DND 3.5e Enhancement Pricing
// ============================================

/**
 * Base price multiplier for enhancement bonuses
 * In 3.5e, enhancement costs are (bonus)² × 2,000 gp
 */
const ENHANCEMENT_BASE_COST = 2000;

/**
 * Calculate the cost of an enhancement bonus
 * Formula: bonus² × 2,000 gp
 * 
 * +1 = 2,000 gp
 * +2 = 8,000 gp
 * +3 = 18,000 gp
 * +4 = 32,000 gp
 * +5 = 50,000 gp
 * +6 = 72,000 gp
 * +7 = 98,000 gp
 * +8 = 128,000 gp
 * +9 = 162,000 gp
 */
export function calculateEnhancementCost(bonus: number): number {
  if (bonus <= 0) return 0;
  return bonus * bonus * ENHANCEMENT_BASE_COST;
}

/**
 * Get the enhancement cost table for reference
 */
export function getEnhancementCostTable(): { bonus: number; cost: number }[] {
  return Array.from({ length: 10 }, (_, i) => ({
    bonus: i,
    cost: calculateEnhancementCost(i),
  }));
}

/**
 * Calculate the maximum enhancement bonus affordable within a budget
 */
export function getMaxAffordableBonus(budget: number): number {
  for (let bonus = 9; bonus >= 0; bonus--) {
    if (calculateEnhancementCost(bonus) <= budget) {
      return bonus;
    }
  }
  return 0;
}

// ============================================
// Quality Cost Calculations
// ============================================

/**
 * Calculate the cost of a magic quality
 * Qualities can either be:
 * - Flat cost (e.g., "2,700 gp")
 * - Bonus equivalent (e.g., "+1 bonus" adds to total enhancement)
 */
export function calculateQualityCost(
  quality: MagicQuality,
  currentEnhancementBonus: number
): number {
  if (quality.is_bonus && quality.bonus_value !== null) {
    // Bonus-based quality: Calculate the difference in enhancement cost
    const oldCost = calculateEnhancementCost(currentEnhancementBonus);
    const newCost = calculateEnhancementCost(currentEnhancementBonus + quality.bonus_value);
    return newCost - oldCost;
  }
  
  if (quality.flat_cost !== null) {
    return quality.flat_cost;
  }
  
  return 0;
}

/**
 * Calculate total effective bonus including qualities
 */
export function calculateEffectiveBonus(
  baseBonus: number,
  qualities: MagicQuality[]
): number {
  let total = baseBonus;
  
  for (const quality of qualities) {
    if (quality.is_bonus && quality.bonus_value !== null) {
      total += quality.bonus_value;
    }
  }
  
  return total;
}

/**
 * Calculate total quality flat costs
 */
export function calculateTotalFlatCosts(qualities: MagicQuality[]): number {
  return qualities.reduce((total, quality) => {
    if (!quality.is_bonus && quality.flat_cost !== null) {
      return total + quality.flat_cost;
    }
    return total;
  }, 0);
}

// ============================================
// Item Total Cost Calculations
// ============================================

/**
 * Calculate the total cost of an enhanced item
 * Total = Base item cost + Enhancement cost + Quality flat costs
 */
export function calculateTotalItemCost(
  baseItem: AnyBaseItem,
  enhancementBonus: number,
  qualities: MagicQuality[]
): number {
  // Base item cost (0 if null/priceless)
  const baseCost = baseItem.cost || 0;
  
  // Enhancement cost only applies to weapons and armor
  let enhancementCost = 0;
  if (isWeapon(baseItem) || isArmor(baseItem)) {
    // Calculate effective bonus including bonus-based qualities
    const effectiveBonus = calculateEffectiveBonus(enhancementBonus, qualities);
    enhancementCost = calculateEnhancementCost(effectiveBonus);
  }
  
  // Flat costs from qualities
  const flatCosts = calculateTotalFlatCosts(qualities);
  
  return baseCost + enhancementCost + flatCosts;
}

/**
 * Calculate how much budget remains after selecting a base item and enhancement
 */
export function calculateRemainingBudget(
  totalBudget: number,
  baseItem: AnyBaseItem,
  enhancementBonus: number
): number {
  const baseCost = baseItem.cost || 0;
  const enhancementCost = (isWeapon(baseItem) || isArmor(baseItem)) 
    ? calculateEnhancementCost(enhancementBonus)
    : 0;
  
  return totalBudget - baseCost - enhancementCost;
}

// ============================================
// Masterwork Pricing
// ============================================

/**
 * Masterwork costs (required for magical enhancement in 3.5e)
 */
export const MASTERWORK_COSTS = {
  weapon: 300,
  armor: 150,
  shield: 150,
} as const;

/**
 * Get the masterwork cost for an item
 * In 3.5e, items must be masterwork before they can be enchanted
 */
export function getMasterworkCost(item: MundaneWeapon | MundaneArmor): number {
  if (isWeapon(item)) {
    return MASTERWORK_COSTS.weapon;
  }
  if (isArmor(item)) {
    if (item.category === 'Shields') {
      return MASTERWORK_COSTS.shield;
    }
    return MASTERWORK_COSTS.armor;
  }
  return 0;
}

/**
 * Calculate total cost including masterwork (if enhancement > 0)
 */
export function calculateTotalWithMasterwork(
  baseItem: AnyBaseItem,
  enhancementBonus: number,
  qualities: MagicQuality[]
): number {
  let total = calculateTotalItemCost(baseItem, enhancementBonus, qualities);
  
  // Add masterwork cost if item is enhanced
  if (enhancementBonus > 0 && (isWeapon(baseItem) || isArmor(baseItem))) {
    total += getMasterworkCost(baseItem as MundaneWeapon | MundaneArmor);
  }
  
  return total;
}

// ============================================
// Budget Allocation Helpers
// ============================================

/**
 * Determine optimal enhancement level for a budget
 * Leaves room for at least some quality additions
 */
export function suggestEnhancementForBudget(
  budget: number,
  maxAllowed: number,
  reserveForQualities: number = 0
): number {
  const availableBudget = budget - reserveForQualities;
  const maxAffordable = getMaxAffordableBonus(availableBudget);
  return Math.min(maxAffordable, maxAllowed);
}

/**
 * Calculate how many bonus-equivalent qualities can fit
 */
export function getMaxBonusQualitiesForBudget(
  budget: number,
  currentEnhancement: number,
  maxTotalBonus: number = 10
): number {
  let bonusRoom = maxTotalBonus - currentEnhancement;
  let qualityCount = 0;
  
  while (bonusRoom > 0) {
    const nextBonus = currentEnhancement + qualityCount + 1;
    const costIncrease = calculateEnhancementCost(nextBonus) - 
                        calculateEnhancementCost(nextBonus - 1);
    
    if (costIncrease > budget) break;
    
    qualityCount++;
    bonusRoom--;
  }
  
  return qualityCount;
}

// ============================================
// Price Formatting
// ============================================

/**
 * Format a gold value for display
 */
export function formatGold(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M gp`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k gp`;
  }
  return `${value.toLocaleString()} gp`;
}

/**
 * Format a gold value with full precision
 */
export function formatGoldFull(value: number): string {
  return `${value.toLocaleString()} gp`;
}
