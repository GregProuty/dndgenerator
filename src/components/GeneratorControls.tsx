'use client';

import { GeneratorFormState, CATEGORY_INFO, RARITY_INFO } from '@/lib/types';

interface GeneratorControlsProps {
  formState: GeneratorFormState;
  onFormChange: (updates: Partial<GeneratorFormState>) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function GeneratorControls({
  formState,
  onFormChange,
  onGenerate,
  isLoading,
}: GeneratorControlsProps) {
  return (
    <div className="panel panel-gold ornate-corners p-6 space-y-6">
      {/* Header */}
      <h2 className="font-display text-2xl text-center tracking-wide" style={{ color: 'var(--gold)' }}>
        Loot Configuration
      </h2>

      {/* Budget Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
          Maximum Budget (gp)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={5000000}
            value={formState.maxCoinValue}
            onChange={(e) => onFormChange({ maxCoinValue: Math.max(1, parseInt(e.target.value) || 0) })}
            className="flex-1 w-full"
          />
          <span className="text-sm opacity-70">gp</span>
        </div>
        {/* Quick budget buttons */}
        <div className="flex flex-wrap gap-2">
          {[100, 500, 1000, 5000, 10000, 50000, 100000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onFormChange({ maxCoinValue: value })}
              className={`px-3 py-1 text-xs rounded transition-all ${
                formState.maxCoinValue === value
                  ? 'bg-bronze text-foreground'
                  : 'bg-panel-border hover:bg-bronze/50'
              }`}
            >
              {value >= 1000 ? `${value / 1000}k` : value}
            </button>
          ))}
        </div>
      </div>

      {/* Item Count Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
          Number of Items
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs opacity-60 block mb-1">Min</label>
            <input
              type="number"
              min={1}
              max={formState.maxItems}
              value={formState.minItems}
              onChange={(e) => {
                const min = Math.max(1, parseInt(e.target.value) || 1);
                onFormChange({ minItems: Math.min(min, formState.maxItems) });
              }}
              className="w-full"
            />
          </div>
          <span className="pt-5">—</span>
          <div className="flex-1">
            <label className="text-xs opacity-60 block mb-1">Max</label>
            <input
              type="number"
              min={formState.minItems}
              max={20}
              value={formState.maxItems}
              onChange={(e) => {
                const max = Math.max(formState.minItems, parseInt(e.target.value) || 1);
                onFormChange({ maxItems: Math.min(max, 20) });
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Generate Categories */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
          Generate From (Base Items)
        </label>
        <div className="space-y-2">
          {CATEGORY_INFO.filter((c) => c.isGenerate).map((category) => (
            <label key={category.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={
                  category.id === 'mundane_weapons' ? formState.includeMundaneWeapons :
                  category.id === 'mundane_armor' ? formState.includeMundaneArmor :
                  formState.includeMundaneItems
                }
                onChange={(e) => {
                  const key = category.id === 'mundane_weapons' ? 'includeMundaneWeapons' :
                              category.id === 'mundane_armor' ? 'includeMundaneArmor' :
                              'includeMundaneItems';
                  onFormChange({ [key]: e.target.checked });
                }}
                className="mt-0.5"
              />
              <div>
                <span className="group-hover:text-gold transition-colors">{category.label}</span>
                <span className="block text-xs opacity-50">{category.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Pre-made Categories */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
          Include Pre-made Magic Items
        </label>
        <div className="space-y-2">
          {CATEGORY_INFO.filter((c) => !c.isGenerate).map((category) => (
            <label key={category.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={
                  category.id === 'magic_items' ? formState.includeWondrousItems :
                  category.id === 'magic_weapons' ? formState.includeMagicWeapons :
                  formState.includeMagicApparel
                }
                onChange={(e) => {
                  const key = category.id === 'magic_items' ? 'includeWondrousItems' :
                              category.id === 'magic_weapons' ? 'includeMagicWeapons' :
                              'includeMagicApparel';
                  onFormChange({ [key]: e.target.checked });
                }}
                className="mt-0.5"
              />
              <div>
                <span className="group-hover:text-gold transition-colors">{category.label}</span>
                <span className="block text-xs opacity-50">{category.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Enhancement Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
            Max Enhancement
          </label>
          <select
            value={formState.maxEnhancementBonus}
            onChange={(e) => onFormChange({ maxEnhancementBonus: parseInt(e.target.value) })}
            className="w-full"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((bonus) => (
              <option key={bonus} value={bonus}>
                {bonus === 0 ? 'None' : `+${bonus}`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
            Max Qualities
          </label>
          <select
            value={formState.maxMagicAttributes}
            onChange={(e) => onFormChange({ maxMagicAttributes: parseInt(e.target.value) })}
            className="w-full"
          >
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count === 0 ? 'None' : count}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
          Allowed Rarities
        </label>
        <div className="flex flex-wrap gap-3">
          {RARITY_INFO.map((rarity) => {
            const isChecked =
              rarity.id === 'common' ? formState.rarityCommon :
              rarity.id === 'uncommon' ? formState.rarityUncommon :
              rarity.id === 'rare' ? formState.rarityRare :
              rarity.id === 'very_rare' ? formState.rarityVeryRare :
              formState.rarityLegendary;

            const key =
              rarity.id === 'common' ? 'rarityCommon' :
              rarity.id === 'uncommon' ? 'rarityUncommon' :
              rarity.id === 'rare' ? 'rarityRare' :
              rarity.id === 'very_rare' ? 'rarityVeryRare' :
              'rarityLegendary';

            return (
              <label
                key={rarity.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onFormChange({ [key]: e.target.checked })}
                />
                <span style={{ color: rarity.color }}>{rarity.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading}
        className="btn btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating...' : 'Generate Loot'}
      </button>
    </div>
  );
}
