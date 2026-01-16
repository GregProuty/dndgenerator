import type {
  Dataset,
  GeneratorConfig,
  GeneratedItem,
  PremadeItem,
  LootItem,
  LootGenerationResult,
  MundaneWeapon,
  MundaneArmor,
  MundaneItem,
  MagicQuality,
  AnyBaseItem,
  AnyPremadeItem,
  GenerateCategory,
  PremadeCategory,
  Rarity,
} from './types';

import {
  getGenerateCategoryItems,
  getPremadeCategoryItems,
  getQualitiesForWeapon,
  getQualitiesForArmor,
  filterByMaxCost,
  filterWithValidCost,
  isWeapon,
  isArmor,
  isMundaneItem,
  canBeEnhanced,
} from './dataset';

import { getRarityFromCost, filterByRarity } from './rarity';

import {
  calculateEnhancementCost,
  calculateTotalWithMasterwork,
  calculateQualityCost,
  calculateEffectiveBonus,
  getMaxAffordableBonus,
} from './pricing';

// ============================================
// Random Utilities
// ============================================

/**
 * Generate a unique ID for an item
 */
function generateId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get a random element from an array
 */
function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array in place (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Item Pool Building
// ============================================

interface ItemPool {
  generateItems: { category: GenerateCategory; items: AnyBaseItem[] }[];
  premadeItems: { category: PremadeCategory; items: AnyPremadeItem[] }[];
  totalGenerateCount: number;
  totalPremadeCount: number;
}

/**
 * Build the pool of available items based on config
 */
function buildItemPool(
  dataset: Dataset,
  config: GeneratorConfig,
  maxCost: number
): ItemPool {
  const generateItems: ItemPool['generateItems'] = [];
  const premadeItems: ItemPool['premadeItems'] = [];

  // Build generate category pools
  for (const category of config.generateCategories) {
    let items = filterWithValidCost(getGenerateCategoryItems(dataset, category));
    items = filterByMaxCost(items, maxCost);
    items = filterByRarity(items, config.rarityFilter);
    
    if (items.length > 0) {
      generateItems.push({ category, items });
    }
  }

  // Build pre-made category pools
  for (const category of config.includePremade) {
    let items = getPremadeCategoryItems(dataset, category);
    items = filterByMaxCost(items, maxCost);
    items = filterByRarity(items, config.rarityFilter);
    
    if (items.length > 0) {
      premadeItems.push({ category, items });
    }
  }

  return {
    generateItems,
    premadeItems,
    totalGenerateCount: generateItems.reduce((sum, g) => sum + g.items.length, 0),
    totalPremadeCount: premadeItems.reduce((sum, p) => sum + p.items.length, 0),
  };
}

// ============================================
// Display Name Generation
// ============================================

/**
 * Generate a display name for an enhanced item
 */
function generateDisplayName(
  baseItem: AnyBaseItem,
  enhancementBonus: number,
  qualities: MagicQuality[]
): string {
  const parts: string[] = [];

  // Enhancement prefix (e.g., "+2")
  if (enhancementBonus > 0) {
    parts.push(`+${enhancementBonus}`);
  }

  // Quality names
  const qualityNames = qualities.map((q) => q.name);
  parts.push(...qualityNames);

  // Base item name
  parts.push(baseItem.name);

  return parts.join(' ');
}

// ============================================
// Quality Selection
// ============================================

/**
 * Select random qualities for an item within budget
 */
function selectQualities(
  dataset: Dataset,
  item: MundaneWeapon | MundaneArmor,
  enhancementBonus: number,
  remainingBudget: number,
  maxQualities: number
): MagicQuality[] {
  if (maxQualities <= 0 || enhancementBonus <= 0) return [];

  // Get applicable qualities
  let availableQualities: MagicQuality[];
  if (isWeapon(item)) {
    availableQualities = getQualitiesForWeapon(dataset, item);
  } else {
    availableQualities = getQualitiesForArmor(dataset, item);
  }

  if (availableQualities.length === 0) return [];

  // Shuffle for randomness
  availableQualities = shuffleArray(availableQualities);

  const selectedQualities: MagicQuality[] = [];
  let currentBudget = remainingBudget;
  let currentEffectiveBonus = enhancementBonus;

  // Max total effective bonus is 10 in 3.5e
  const MAX_EFFECTIVE_BONUS = 10;

  for (const quality of availableQualities) {
    if (selectedQualities.length >= maxQualities) break;

    // Check if this quality would exceed effective bonus limit
    if (quality.is_bonus && quality.bonus_value !== null) {
      if (currentEffectiveBonus + quality.bonus_value > MAX_EFFECTIVE_BONUS) {
        continue;
      }
    }

    // Calculate cost of adding this quality
    const cost = calculateQualityCost(quality, currentEffectiveBonus);

    if (cost <= currentBudget) {
      selectedQualities.push(quality);
      currentBudget -= cost;
      
      if (quality.is_bonus && quality.bonus_value !== null) {
        currentEffectiveBonus += quality.bonus_value;
      }
    }
  }

  return selectedQualities;
}

// ============================================
// Item Generation
// ============================================

/**
 * Generate a single item from base item categories
 */
function generateSingleItem(
  dataset: Dataset,
  pool: ItemPool,
  config: GeneratorConfig,
  budget: number
): GeneratedItem | null {
  if (pool.totalGenerateCount === 0) return null;

  // Select a random category weighted by item count
  const totalItems = pool.totalGenerateCount;
  let roll = Math.random() * totalItems;
  
  let selectedCategory: GenerateCategory | null = null;
  let selectedItems: AnyBaseItem[] = [];

  for (const { category, items } of pool.generateItems) {
    roll -= items.length;
    if (roll <= 0) {
      selectedCategory = category;
      selectedItems = items;
      break;
    }
  }

  if (!selectedCategory || selectedItems.length === 0) return null;

  // Filter items that fit in budget
  const affordableItems = filterByMaxCost(selectedItems, budget);
  if (affordableItems.length === 0) return null;

  // Select a random base item
  const baseItem = randomElement(affordableItems);
  if (!baseItem) return null;

  const baseCost = baseItem.cost || 0;
  let remainingBudget = budget - baseCost;

  // Determine enhancement and qualities
  let enhancementBonus = 0;
  let qualities: MagicQuality[] = [];

  if (canBeEnhanced(baseItem)) {
    // Calculate max affordable enhancement
    const maxAffordable = getMaxAffordableBonus(remainingBudget);
    const maxAllowed = config.maxEnhancementBonus;
    const maxBonus = Math.min(maxAffordable, maxAllowed);

    if (maxBonus > 0) {
      // Random enhancement between 1 and max
      enhancementBonus = randomInt(1, maxBonus);
      const enhancementCost = calculateEnhancementCost(enhancementBonus);
      remainingBudget -= enhancementCost;

      // Select qualities
      if (config.maxMagicAttributes > 0 && remainingBudget > 0) {
        qualities = selectQualities(
          dataset,
          baseItem as MundaneWeapon | MundaneArmor,
          enhancementBonus,
          remainingBudget,
          config.maxMagicAttributes
        );
      }
    }
  }

  // Calculate total cost
  const totalCost = calculateTotalWithMasterwork(baseItem, enhancementBonus, qualities);

  // Determine item type
  let itemType: GeneratedItem['itemType'] = 'item';
  if (isWeapon(baseItem)) itemType = 'weapon';
  else if (isArmor(baseItem)) itemType = 'armor';

  return {
    id: generateId(),
    baseItem,
    enhancementBonus,
    magicQualities: qualities,
    totalCost,
    rarity: getRarityFromCost(totalCost),
    isGenerated: true,
    displayName: generateDisplayName(baseItem, enhancementBonus, qualities),
    itemType,
  };
}

/**
 * Select a single pre-made item
 */
function selectPremadeItem(
  pool: ItemPool,
  budget: number
): PremadeItem | null {
  if (pool.totalPremadeCount === 0) return null;

  // Gather all affordable pre-made items
  const affordableItems: { item: AnyPremadeItem; category: PremadeCategory }[] = [];

  for (const { category, items } of pool.premadeItems) {
    for (const item of items) {
      if (item.cost <= budget) {
        affordableItems.push({ item, category });
      }
    }
  }

  if (affordableItems.length === 0) return null;

  // Select random item
  const selection = randomElement(affordableItems);
  if (!selection) return null;

  const { item, category } = selection;

  // Map category to item type
  let itemType: PremadeItem['itemType'] = 'magic_item';
  if (category === 'magic_weapons') itemType = 'magic_weapon';
  else if (category === 'magic_apparel') itemType = 'magic_apparel';

  return {
    id: generateId(),
    item,
    totalCost: item.cost,
    rarity: getRarityFromCost(item.cost),
    isGenerated: false,
    displayName: item.name,
    itemType,
  };
}

// ============================================
// Main Generation Function
// ============================================

/**
 * Generate a loot table based on configuration
 * Uses a shared pool budget - all items must fit within total budget
 */
export function generateLoot(
  dataset: Dataset,
  config: GeneratorConfig
): LootGenerationResult {
  const items: LootItem[] = [];
  let remainingBudget = config.maxCoinValue;

  // Determine number of items to generate
  const [minItems, maxItems] = config.itemCountRange;
  const targetItemCount = randomInt(minItems, maxItems);

  // Build item pool
  const pool = buildItemPool(dataset, config, config.maxCoinValue);

  // Check if we have any items to choose from
  const hasGenerateItems = pool.totalGenerateCount > 0;
  const hasPremadeItems = pool.totalPremadeCount > 0;

  if (!hasGenerateItems && !hasPremadeItems) {
    return {
      items: [],
      totalValue: 0,
      config,
      timestamp: Date.now(),
    };
  }

  // Generate items until we hit the target or run out of budget
  let attempts = 0;
  const maxAttempts = targetItemCount * 10; // Prevent infinite loops

  while (items.length < targetItemCount && attempts < maxAttempts && remainingBudget > 0) {
    attempts++;

    // Decide whether to generate or pick pre-made
    const generateWeight = hasGenerateItems ? pool.totalGenerateCount : 0;
    const premadeWeight = hasPremadeItems ? pool.totalPremadeCount : 0;
    const totalWeight = generateWeight + premadeWeight;

    if (totalWeight === 0) break;

    const roll = Math.random() * totalWeight;
    const useGenerate = roll < generateWeight;

    let newItem: LootItem | null = null;

    if (useGenerate && hasGenerateItems) {
      newItem = generateSingleItem(dataset, pool, config, remainingBudget);
    } else if (hasPremadeItems) {
      newItem = selectPremadeItem(pool, remainingBudget);
    }

    if (newItem) {
      items.push(newItem);
      remainingBudget -= newItem.totalCost;
    }
  }

  // Calculate total value
  const totalValue = items.reduce((sum, item) => sum + item.totalCost, 0);

  return {
    items,
    totalValue,
    config,
    timestamp: Date.now(),
  };
}

// ============================================
// Utility Exports
// ============================================

/**
 * Generate a single random item (for testing/preview)
 */
export function generateSingleRandomItem(
  dataset: Dataset,
  config: GeneratorConfig
): LootItem | null {
  const pool = buildItemPool(dataset, config, config.maxCoinValue);

  const hasGenerateItems = pool.totalGenerateCount > 0;
  const hasPremadeItems = pool.totalPremadeCount > 0;

  if (!hasGenerateItems && !hasPremadeItems) return null;

  // Randomly choose generate or pre-made
  if (hasGenerateItems && (!hasPremadeItems || Math.random() < 0.5)) {
    return generateSingleItem(dataset, pool, config, config.maxCoinValue);
  } else if (hasPremadeItems) {
    return selectPremadeItem(pool, config.maxCoinValue);
  }

  return null;
}

/**
 * Re-roll a single item (replace one item in the results)
 */
export function rerollItem(
  dataset: Dataset,
  config: GeneratorConfig,
  currentItems: LootItem[],
  indexToReroll: number
): LootGenerationResult {
  const items = [...currentItems];
  
  // Calculate budget used by other items
  const otherItemsCost = items
    .filter((_, i) => i !== indexToReroll)
    .reduce((sum, item) => sum + item.totalCost, 0);
  
  const availableBudget = config.maxCoinValue - otherItemsCost;
  
  if (availableBudget <= 0) {
    // Can't afford any new item, just remove the old one
    items.splice(indexToReroll, 1);
  } else {
    // Generate a new item with the available budget
    const pool = buildItemPool(dataset, config, availableBudget);
    
    const hasGenerateItems = pool.totalGenerateCount > 0;
    const hasPremadeItems = pool.totalPremadeCount > 0;
    
    let newItem: LootItem | null = null;
    
    if (hasGenerateItems && (!hasPremadeItems || Math.random() < 0.5)) {
      newItem = generateSingleItem(dataset, pool, config, availableBudget);
    } else if (hasPremadeItems) {
      newItem = selectPremadeItem(pool, availableBudget);
    }
    
    if (newItem) {
      items[indexToReroll] = newItem;
    } else {
      items.splice(indexToReroll, 1);
    }
  }
  
  const totalValue = items.reduce((sum, item) => sum + item.totalCost, 0);
  
  return {
    items,
    totalValue,
    config,
    timestamp: Date.now(),
  };
}
