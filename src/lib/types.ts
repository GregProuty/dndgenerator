// ============================================
// Dataset Types (matching the JSON structure)
// ============================================

export interface DatasetMetadata {
  version: string;
  description: string;
  source_files: string[];
}

// Base item interfaces for the dataset
export interface MundaneWeapon {
  name: string;
  cost: number | null;
  type: "Mundane Weapon";
  damage_small: string | null;
  damage_medium: string | null;
  critical: string | null;
  range_increment: string | null;
  weight: string | null;
  damage_type: string | null;
  category: string;
  attack_type: "Melee" | "Ranged";
}

export interface MundaneArmor {
  name: string;
  cost: number | null;
  type: "Mundane Armor";
  tier: string | null;
  armor_bonus: string | null;
  max_dex_bonus: string | null;
  armor_check_penalty: string | null;
  arcane_spell_failure: string | null;
  speed_30: string | null;
  weight: string | null;
  category: string;
  detail?: string;
}

export interface MundaneItem {
  name: string;
  cost: number | null;
  type: "Mundane Item";
  category: string;
  weight: string | null;
}

export interface MagicWeapon {
  name: string;
  cost: number;
  type: "Magic Weapon";
}

export interface MagicItem {
  name: string;
  cost: number;
  type: "Wondrous Item";
}

export interface MagicApparel {
  name: string;
  cost: number;
  type: "Magic Apparel";
}

export interface MagicQuality {
  name: string;
  type: string;
  price_modifier: string;
  is_bonus: boolean;
  bonus_value: number | null;
  flat_cost: number | null;
}

export interface QualitiesByType {
  apparel: MagicQuality[];
  shield: MagicQuality[];
  melee_weapon: MagicQuality[];
  ranged_weapon: MagicQuality[];
}

export interface Dataset {
  metadata: DatasetMetadata;
  items: {
    mundane_weapons: MundaneWeapon[];
    mundane_items: MundaneItem[];
    mundane_armor: MundaneArmor[];
    diablo_armor: unknown[]; // Not used, but exists in dataset
    magic_weapons: MagicWeapon[];
    magic_items: MagicItem[];
    magic_apparel: MagicApparel[];
    production_items: unknown[]; // Not used, redundant
  };
  qualities: {
    magic_qualities: MagicQuality[];
    production_qualities: unknown[]; // Not used
    by_type: QualitiesByType;
  };
}

// ============================================
// Generator Configuration Types
// ============================================

// Categories used as BASE items for custom generation
export type GenerateCategory = 
  | 'mundane_weapons' 
  | 'mundane_armor' 
  | 'mundane_items';

// Pre-made items included as-is
export type PremadeCategory =
  | 'magic_items'      // Wondrous Items
  | 'magic_weapons'    // Named magic weapons
  | 'magic_apparel';   // Named magic armor/clothing

// Rarity tiers based on item value
export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';

export interface GeneratorConfig {
  maxCoinValue: number;
  itemCountRange: [number, number];
  generateCategories: GenerateCategory[];
  includePremade: PremadeCategory[];
  rarityFilter: Rarity[];
  maxMagicAttributes: number;
  maxEnhancementBonus: number; // 0-9
}

// ============================================
// Generated Item Types
// ============================================

// Union type for any base item that can be enhanced
export type EnhanceableBaseItem = MundaneWeapon | MundaneArmor;
export type AnyBaseItem = MundaneWeapon | MundaneArmor | MundaneItem;
export type AnyPremadeItem = MagicWeapon | MagicItem | MagicApparel;

// A custom generated item (base + enhancements + qualities)
export interface GeneratedItem {
  id: string;
  baseItem: AnyBaseItem;
  enhancementBonus: number;
  magicQualities: MagicQuality[];
  totalCost: number;
  rarity: Rarity;
  isGenerated: true;
  displayName: string;
  itemType: 'weapon' | 'armor' | 'item';
}

// A pre-made magic item included as-is
export interface PremadeItem {
  id: string;
  item: AnyPremadeItem;
  totalCost: number;
  rarity: Rarity;
  isGenerated: false;
  displayName: string;
  itemType: 'magic_weapon' | 'magic_item' | 'magic_apparel';
}

// Union type for any loot item
export type LootItem = GeneratedItem | PremadeItem;

// ============================================
// Loot Generation Result
// ============================================

export interface LootGenerationResult {
  items: LootItem[];
  totalValue: number;
  config: GeneratorConfig;
  timestamp: number;
}

// ============================================
// UI State Types
// ============================================

export interface GeneratorFormState {
  maxCoinValue: number;
  minItems: number;
  maxItems: number;
  // Generate categories
  includeMundaneWeapons: boolean;
  includeMundaneArmor: boolean;
  includeMundaneItems: boolean;
  // Pre-made categories
  includeWondrousItems: boolean;
  includeMagicWeapons: boolean;
  includeMagicApparel: boolean;
  // Filters
  rarityCommon: boolean;
  rarityUncommon: boolean;
  rarityRare: boolean;
  rarityVeryRare: boolean;
  rarityLegendary: boolean;
  // Enhancement options
  maxMagicAttributes: number;
  maxEnhancementBonus: number;
}

// Default form state
export const DEFAULT_FORM_STATE: GeneratorFormState = {
  maxCoinValue: 10000,
  minItems: 1,
  maxItems: 5,
  // Generate categories - enabled by default
  includeMundaneWeapons: true,
  includeMundaneArmor: true,
  includeMundaneItems: true,
  // Pre-made categories - disabled by default
  includeWondrousItems: false,
  includeMagicWeapons: false,
  includeMagicApparel: false,
  // Filters - all enabled by default
  rarityCommon: true,
  rarityUncommon: true,
  rarityRare: true,
  rarityVeryRare: true,
  rarityLegendary: true,
  // Enhancement options
  maxMagicAttributes: 3,
  maxEnhancementBonus: 5,
};

// Helper to convert form state to generator config
export function formStateToConfig(state: GeneratorFormState): GeneratorConfig {
  const generateCategories: GenerateCategory[] = [];
  if (state.includeMundaneWeapons) generateCategories.push('mundane_weapons');
  if (state.includeMundaneArmor) generateCategories.push('mundane_armor');
  if (state.includeMundaneItems) generateCategories.push('mundane_items');

  const includePremade: PremadeCategory[] = [];
  if (state.includeWondrousItems) includePremade.push('magic_items');
  if (state.includeMagicWeapons) includePremade.push('magic_weapons');
  if (state.includeMagicApparel) includePremade.push('magic_apparel');

  const rarityFilter: Rarity[] = [];
  if (state.rarityCommon) rarityFilter.push('common');
  if (state.rarityUncommon) rarityFilter.push('uncommon');
  if (state.rarityRare) rarityFilter.push('rare');
  if (state.rarityVeryRare) rarityFilter.push('very_rare');
  if (state.rarityLegendary) rarityFilter.push('legendary');

  return {
    maxCoinValue: state.maxCoinValue,
    itemCountRange: [state.minItems, state.maxItems],
    generateCategories,
    includePremade,
    rarityFilter,
    maxMagicAttributes: state.maxMagicAttributes,
    maxEnhancementBonus: state.maxEnhancementBonus,
  };
}

// ============================================
// Utility Types
// ============================================

export type QualityType = 'apparel' | 'shield' | 'melee_weapon' | 'ranged_weapon';

export interface CategoryInfo {
  id: GenerateCategory | PremadeCategory;
  label: string;
  description: string;
  isGenerate: boolean;
}

export const CATEGORY_INFO: CategoryInfo[] = [
  // Generate categories
  { id: 'mundane_weapons', label: 'Weapons', description: 'Swords, axes, bows, etc.', isGenerate: true },
  { id: 'mundane_armor', label: 'Armor', description: 'Plate, chain, shields, etc.', isGenerate: true },
  { id: 'mundane_items', label: 'General Items', description: 'Rope, torches, tools (no enhancements)', isGenerate: true },
  // Pre-made categories
  { id: 'magic_items', label: 'Wondrous Items', description: 'Bags, Ioun Stones, etc.', isGenerate: false },
  { id: 'magic_weapons', label: 'Magic Weapons', description: 'Flame Tongue, Holy Avenger, etc.', isGenerate: false },
  { id: 'magic_apparel', label: 'Magic Apparel', description: 'Celestial Armor, Boots of Speed, etc.', isGenerate: false },
];

export const RARITY_INFO: { id: Rarity; label: string; minCost: number; maxCost: number; color: string }[] = [
  { id: 'common', label: 'Common', minCost: 0, maxCost: 100, color: '#9d9d9d' },
  { id: 'uncommon', label: 'Uncommon', minCost: 101, maxCost: 500, color: '#4169e1' },
  { id: 'rare', label: 'Rare', minCost: 501, maxCost: 2000, color: '#ffd700' },
  { id: 'very_rare', label: 'Very Rare', minCost: 2001, maxCost: 10000, color: '#9932cc' },
  { id: 'legendary', label: 'Legendary', minCost: 10001, maxCost: Infinity, color: '#ff8c00' },
];
