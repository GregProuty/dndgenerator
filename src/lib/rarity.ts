import type { Rarity, LootItem } from './types';
import { RARITY_INFO } from './types';

// ============================================
// Rarity Thresholds (in gold pieces)
// ============================================

export const RARITY_THRESHOLDS = {
  common: { min: 0, max: 100 },
  uncommon: { min: 101, max: 500 },
  rare: { min: 501, max: 2000 },
  very_rare: { min: 2001, max: 10000 },
  legendary: { min: 10001, max: Infinity },
} as const;

// ============================================
// Rarity Classification
// ============================================

/**
 * Determine the rarity of an item based on its cost
 */
export function getRarityFromCost(cost: number): Rarity {
  if (cost <= RARITY_THRESHOLDS.common.max) return 'common';
  if (cost <= RARITY_THRESHOLDS.uncommon.max) return 'uncommon';
  if (cost <= RARITY_THRESHOLDS.rare.max) return 'rare';
  if (cost <= RARITY_THRESHOLDS.very_rare.max) return 'very_rare';
  return 'legendary';
}

/**
 * Get the minimum cost for a given rarity
 */
export function getMinCostForRarity(rarity: Rarity): number {
  return RARITY_THRESHOLDS[rarity].min;
}

/**
 * Get the maximum cost for a given rarity
 */
export function getMaxCostForRarity(rarity: Rarity): number {
  return RARITY_THRESHOLDS[rarity].max;
}

/**
 * Check if a cost falls within a given rarity range
 */
export function isWithinRarityRange(cost: number, rarity: Rarity): boolean {
  const { min, max } = RARITY_THRESHOLDS[rarity];
  return cost >= min && cost <= max;
}

// ============================================
// Rarity Filtering
// ============================================

/**
 * Filter items to only those matching the allowed rarities
 */
export function filterByRarity<T extends { cost: number | null }>(
  items: T[],
  allowedRarities: Rarity[]
): T[] {
  if (allowedRarities.length === 0) return items;
  
  return items.filter((item) => {
    if (item.cost === null) return false;
    const rarity = getRarityFromCost(item.cost);
    return allowedRarities.includes(rarity);
  });
}

/**
 * Filter loot items by rarity
 */
export function filterLootByRarity(
  items: LootItem[],
  allowedRarities: Rarity[]
): LootItem[] {
  if (allowedRarities.length === 0) return items;
  
  return items.filter((item) => allowedRarities.includes(item.rarity));
}

// ============================================
// Rarity Display
// ============================================

/**
 * Get the display color for a rarity (CSS color)
 */
export function getRarityColor(rarity: Rarity): string {
  const info = RARITY_INFO.find((r) => r.id === rarity);
  return info?.color || '#9d9d9d';
}

/**
 * Get the CSS class for a rarity
 */
export function getRarityClass(rarity: Rarity): string {
  return `rarity-${rarity.replace('_', '-')}`;
}

/**
 * Get display label for a rarity
 */
export function getRarityLabel(rarity: Rarity): string {
  const info = RARITY_INFO.find((r) => r.id === rarity);
  return info?.label || rarity;
}

// ============================================
// Rarity Statistics
// ============================================

/**
 * Count items by rarity
 */
export function countByRarity<T extends { cost: number | null }>(
  items: T[]
): Record<Rarity, number> {
  const counts: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    very_rare: 0,
    legendary: 0,
  };

  for (const item of items) {
    if (item.cost !== null) {
      const rarity = getRarityFromCost(item.cost);
      counts[rarity]++;
    }
  }

  return counts;
}

/**
 * Get a random rarity weighted by value ranges
 * Higher budget = higher chance of better rarities
 */
export function getRandomRarityForBudget(
  maxBudget: number,
  allowedRarities: Rarity[]
): Rarity {
  // Filter to only rarities that fit the budget
  const validRarities = allowedRarities.filter(
    (rarity) => RARITY_THRESHOLDS[rarity].min <= maxBudget
  );

  if (validRarities.length === 0) return 'common';

  // Weight by how much of the rarity range fits in the budget
  const weights = validRarities.map((rarity) => {
    const { min, max } = RARITY_THRESHOLDS[rarity];
    const effectiveMax = Math.min(max, maxBudget);
    const range = effectiveMax - min;
    return Math.max(range, 1);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < validRarities.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return validRarities[i];
  }

  return validRarities[validRarities.length - 1];
}
