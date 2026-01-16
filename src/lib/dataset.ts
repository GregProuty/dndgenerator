import type {
  Dataset,
  MundaneWeapon,
  MundaneArmor,
  MundaneItem,
  MagicWeapon,
  MagicItem,
  MagicApparel,
  MagicQuality,
  QualitiesByType,
  GenerateCategory,
  PremadeCategory,
  AnyBaseItem,
  AnyPremadeItem,
} from './types';

// ============================================
// Dataset Loading
// ============================================

let cachedDataset: Dataset | null = null;

/**
 * Load the dataset from the public folder
 * Uses caching to avoid reloading on every call
 */
export async function loadDataset(): Promise<Dataset> {
  if (cachedDataset) {
    return cachedDataset;
  }

  const response = await fetch('/dnd_dataset.json');
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.statusText}`);
  }

  cachedDataset = await response.json();
  return cachedDataset!;
}

/**
 * Load dataset synchronously (for server-side use)
 * Note: This requires the dataset to be imported directly
 */
export function loadDatasetSync(data: Dataset): void {
  cachedDataset = data;
}

/**
 * Clear the dataset cache (useful for testing)
 */
export function clearDatasetCache(): void {
  cachedDataset = null;
}

// ============================================
// Item Retrieval by Category
// ============================================

/**
 * Get all items from a generation category
 */
export function getGenerateCategoryItems(
  dataset: Dataset,
  category: GenerateCategory
): AnyBaseItem[] {
  switch (category) {
    case 'mundane_weapons':
      return dataset.items.mundane_weapons;
    case 'mundane_armor':
      return dataset.items.mundane_armor;
    case 'mundane_items':
      return dataset.items.mundane_items;
    default:
      return [];
  }
}

/**
 * Get all items from a pre-made category
 */
export function getPremadeCategoryItems(
  dataset: Dataset,
  category: PremadeCategory
): AnyPremadeItem[] {
  switch (category) {
    case 'magic_weapons':
      return dataset.items.magic_weapons;
    case 'magic_items':
      return dataset.items.magic_items;
    case 'magic_apparel':
      return dataset.items.magic_apparel;
    default:
      return [];
  }
}

// ============================================
// Filtering Functions
// ============================================

/**
 * Filter items by maximum cost
 */
export function filterByMaxCost<T extends { cost: number | null }>(
  items: T[],
  maxCost: number
): T[] {
  return items.filter((item) => item.cost !== null && item.cost <= maxCost);
}

/**
 * Filter items to only those with a valid cost
 */
export function filterWithValidCost<T extends { cost: number | null }>(
  items: T[]
): T[] {
  return items.filter((item) => item.cost !== null && item.cost > 0);
}

/**
 * Get weapons filtered for generation
 * Excludes items with no cost (priceless items)
 */
export function getValidWeapons(dataset: Dataset): MundaneWeapon[] {
  return filterWithValidCost(dataset.items.mundane_weapons);
}

/**
 * Get armor filtered for generation
 * Excludes items with no cost (priceless items)
 */
export function getValidArmor(dataset: Dataset): MundaneArmor[] {
  return filterWithValidCost(dataset.items.mundane_armor);
}

/**
 * Get mundane items filtered for generation
 */
export function getValidMundaneItems(dataset: Dataset): MundaneItem[] {
  return filterWithValidCost(dataset.items.mundane_items);
}

/**
 * Get magic weapons filtered by cost
 */
export function getValidMagicWeapons(dataset: Dataset, maxCost?: number): MagicWeapon[] {
  const items = dataset.items.magic_weapons.filter((item) => item.cost > 0);
  return maxCost !== undefined ? filterByMaxCost(items, maxCost) : items;
}

/**
 * Get magic items (wondrous) filtered by cost
 */
export function getValidMagicItems(dataset: Dataset, maxCost?: number): MagicItem[] {
  const items = dataset.items.magic_items.filter((item) => item.cost > 0);
  return maxCost !== undefined ? filterByMaxCost(items, maxCost) : items;
}

/**
 * Get magic apparel filtered by cost
 */
export function getValidMagicApparel(dataset: Dataset, maxCost?: number): MagicApparel[] {
  const items = dataset.items.magic_apparel.filter((item) => item.cost > 0);
  return maxCost !== undefined ? filterByMaxCost(items, maxCost) : items;
}

// ============================================
// Quality Retrieval
// ============================================

/**
 * Get qualities applicable to a specific item type
 */
export function getQualitiesForType(
  dataset: Dataset,
  qualityType: keyof QualitiesByType
): MagicQuality[] {
  return dataset.qualities.by_type[qualityType] || [];
}

/**
 * Get qualities for a weapon based on its attack type
 */
export function getQualitiesForWeapon(
  dataset: Dataset,
  weapon: MundaneWeapon
): MagicQuality[] {
  if (weapon.attack_type === 'Melee') {
    return getQualitiesForType(dataset, 'melee_weapon');
  } else {
    return getQualitiesForType(dataset, 'ranged_weapon');
  }
}

/**
 * Get qualities for armor based on its category
 */
export function getQualitiesForArmor(
  dataset: Dataset,
  armor: MundaneArmor
): MagicQuality[] {
  if (armor.category === 'Shields') {
    return getQualitiesForType(dataset, 'shield');
  } else {
    return getQualitiesForType(dataset, 'apparel');
  }
}

/**
 * Filter qualities by maximum bonus cost
 * Used to limit available qualities based on enhancement budget
 */
export function filterQualitiesByBudget(
  qualities: MagicQuality[],
  maxBonusCost: number,
  maxFlatCost: number
): MagicQuality[] {
  return qualities.filter((q) => {
    if (q.is_bonus && q.bonus_value !== null) {
      return q.bonus_value <= maxBonusCost;
    }
    if (!q.is_bonus && q.flat_cost !== null) {
      return q.flat_cost <= maxFlatCost;
    }
    return false;
  });
}

// ============================================
// Item Type Detection
// ============================================

/**
 * Check if an item is a weapon
 */
export function isWeapon(item: AnyBaseItem): item is MundaneWeapon {
  return item.type === 'Mundane Weapon';
}

/**
 * Check if an item is armor
 */
export function isArmor(item: AnyBaseItem): item is MundaneArmor {
  return item.type === 'Mundane Armor';
}

/**
 * Check if an item is a mundane item (non-enhanceable)
 */
export function isMundaneItem(item: AnyBaseItem): item is MundaneItem {
  return item.type === 'Mundane Item';
}

/**
 * Check if a base item can receive enhancements
 */
export function canBeEnhanced(item: AnyBaseItem): item is MundaneWeapon | MundaneArmor {
  return isWeapon(item) || isArmor(item);
}

// ============================================
// Statistics
// ============================================

/**
 * Get counts of items per category
 */
export function getDatasetStats(dataset: Dataset): Record<string, number> {
  return {
    mundane_weapons: dataset.items.mundane_weapons.length,
    mundane_armor: dataset.items.mundane_armor.length,
    mundane_items: dataset.items.mundane_items.length,
    magic_weapons: dataset.items.magic_weapons.length,
    magic_items: dataset.items.magic_items.length,
    magic_apparel: dataset.items.magic_apparel.length,
    apparel_qualities: dataset.qualities.by_type.apparel.length,
    shield_qualities: dataset.qualities.by_type.shield.length,
    melee_weapon_qualities: dataset.qualities.by_type.melee_weapon.length,
    ranged_weapon_qualities: dataset.qualities.by_type.ranged_weapon.length,
  };
}
