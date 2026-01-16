'use client';

import { LootItem, GeneratedItem, PremadeItem, MundaneWeapon, MundaneArmor } from '@/lib/types';
import { getRarityColor, getRarityLabel } from '@/lib/rarity';
import { formatGold } from '@/lib/pricing';
import { isWeapon, isArmor } from '@/lib/dataset';

interface ItemCardProps {
  item: LootItem;
  onReroll?: () => void;
}

export function ItemCard({ item, onReroll }: ItemCardProps) {
  const rarityColor = getRarityColor(item.rarity);
  const rarityLabel = getRarityLabel(item.rarity);

  return (
    <div className="panel gold-glow transition-all duration-200 p-4 space-y-3 relative">
      {/* Rarity indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t"
        style={{ backgroundColor: rarityColor }}
      />

      {/* Item Name */}
      <h3
        className="font-display text-lg pr-16 leading-tight"
        style={{ color: rarityColor }}
      >
        {item.displayName}
      </h3>

      {/* Item Type Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded bg-panel-border">
          {item.isGenerated ? getItemTypeLabel(item) : getPremadeTypeLabel(item)}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: `${rarityColor}30`, color: rarityColor }}
        >
          {rarityLabel}
        </span>
      </div>

      {/* Item Details */}
      {item.isGenerated ? (
        <GeneratedItemDetails item={item} />
      ) : (
        <PremadeItemDetails item={item} />
      )}

      {/* Cost */}
      <div className="pt-2 border-t border-panel-border flex items-center justify-between">
        <span className="text-sm opacity-70">Value</span>
        <span className="font-display text-gold">{formatGold(item.totalCost)}</span>
      </div>

      {/* Reroll Button */}
      {onReroll && (
        <button
          onClick={onReroll}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded bg-panel-border hover:bg-bronze/50 transition-colors"
          title="Reroll this item"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function GeneratedItemDetails({ item }: { item: GeneratedItem }) {
  const baseItem = item.baseItem;

  return (
    <div className="space-y-2 text-sm">
      {/* Base Item Name (if different from display) */}
      {item.enhancementBonus > 0 && (
        <div className="opacity-70">
          Base: {baseItem.name}
        </div>
      )}

      {/* Weapon Stats */}
      {isWeapon(baseItem) && (
        <WeaponStats weapon={baseItem} />
      )}

      {/* Armor Stats */}
      {isArmor(baseItem) && (
        <ArmorStats armor={baseItem} />
      )}

      {/* Enhancement */}
      {item.enhancementBonus > 0 && (
        <div className="flex items-center gap-2">
          <span className="opacity-70">Enhancement:</span>
          <span className="text-gold">+{item.enhancementBonus}</span>
        </div>
      )}

      {/* Magic Qualities */}
      {item.magicQualities.length > 0 && (
        <div>
          <span className="opacity-70 block mb-1">Qualities:</span>
          <div className="flex flex-wrap gap-1">
            {item.magicQualities.map((quality, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-very-rare/20 text-very-rare"
              >
                {quality.name}
                {quality.is_bonus && quality.bonus_value && ` (+${quality.bonus_value})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PremadeItemDetails({ item }: { item: PremadeItem }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="opacity-70">
        {item.item.type}
      </div>
    </div>
  );
}

function WeaponStats({ weapon }: { weapon: MundaneWeapon }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {weapon.damage_medium && (
        <>
          <span className="opacity-60">Damage:</span>
          <span>{weapon.damage_medium}</span>
        </>
      )}
      {weapon.critical && (
        <>
          <span className="opacity-60">Critical:</span>
          <span>{weapon.critical}</span>
        </>
      )}
      {weapon.damage_type && (
        <>
          <span className="opacity-60">Type:</span>
          <span>{weapon.damage_type}</span>
        </>
      )}
      {weapon.range_increment && (
        <>
          <span className="opacity-60">Range:</span>
          <span>{weapon.range_increment}</span>
        </>
      )}
      {weapon.category && (
        <>
          <span className="opacity-60">Category:</span>
          <span>{weapon.category}</span>
        </>
      )}
    </div>
  );
}

function ArmorStats({ armor }: { armor: MundaneArmor }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {armor.armor_bonus && (
        <>
          <span className="opacity-60">AC Bonus:</span>
          <span>+{parseFloat(armor.armor_bonus)}</span>
        </>
      )}
      {armor.max_dex_bonus && (
        <>
          <span className="opacity-60">Max Dex:</span>
          <span>+{parseFloat(armor.max_dex_bonus)}</span>
        </>
      )}
      {armor.armor_check_penalty && parseFloat(armor.armor_check_penalty) !== 0 && (
        <>
          <span className="opacity-60">Check Penalty:</span>
          <span>{armor.armor_check_penalty}</span>
        </>
      )}
      {armor.category && (
        <>
          <span className="opacity-60">Category:</span>
          <span>{armor.category}</span>
        </>
      )}
    </div>
  );
}

function getItemTypeLabel(item: GeneratedItem): string {
  switch (item.itemType) {
    case 'weapon':
      return 'Weapon';
    case 'armor':
      return 'Armor';
    case 'item':
      return 'Item';
    default:
      return 'Item';
  }
}

function getPremadeTypeLabel(item: PremadeItem): string {
  switch (item.itemType) {
    case 'magic_weapon':
      return 'Magic Weapon';
    case 'magic_item':
      return 'Wondrous Item';
    case 'magic_apparel':
      return 'Magic Apparel';
    default:
      return 'Magic Item';
  }
}
