'use client';

import { LootGenerationResult } from '@/lib/types';
import { ItemCard } from './ItemCard';
import { formatGoldFull } from '@/lib/pricing';

interface LootResultsProps {
  result: LootGenerationResult | null;
  onRerollItem: (index: number) => void;
  onRerollAll: () => void;
  onCopy: () => void;
}

export function LootResults({
  result,
  onRerollItem,
  onRerollAll,
  onCopy,
}: LootResultsProps) {
  if (!result) {
    return (
      <div className="panel panel-gold ornate-corners p-8 text-center">
        <div className="opacity-50 space-y-2">
          <svg
            className="w-16 h-16 mx-auto opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="font-display text-lg">No Loot Generated</p>
          <p className="text-sm">Configure your settings and click Generate Loot</p>
        </div>
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="panel panel-gold ornate-corners p-8 text-center">
        <div className="opacity-50 space-y-2">
          <svg
            className="w-16 h-16 mx-auto opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-display text-lg">No Items Found</p>
          <p className="text-sm">Try adjusting your budget or enabling more categories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel panel-gold p-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl" style={{ color: 'var(--gold)' }}>
            Generated Loot
          </h2>
          <p className="text-sm opacity-70">
            {result.items.length} item{result.items.length !== 1 ? 's' : ''} •{' '}
            Total value: <span className="text-gold">{formatGoldFull(result.totalValue)}</span>
            {' '}/ {formatGoldFull(result.config.maxCoinValue)} budget
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="btn text-sm py-2"
            title="Copy to clipboard"
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>
          <button
            onClick={onRerollAll}
            className="btn btn-primary text-sm py-2"
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
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
            Reroll All
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="item-grid">
        {result.items.map((item, index) => (
          <ItemCard
            key={item.id}
            item={item}
            onReroll={() => onRerollItem(index)}
          />
        ))}
      </div>

      {/* Budget Summary */}
      <div className="panel p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">Budget Remaining:</span>
          <span className={result.config.maxCoinValue - result.totalValue < 0 ? 'text-red-400' : 'text-green-400'}>
            {formatGoldFull(result.config.maxCoinValue - result.totalValue)}
          </span>
        </div>
        <div className="mt-2 h-2 bg-panel-border rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min((result.totalValue / result.config.maxCoinValue) * 100, 100)}%`,
              background: `linear-gradient(90deg, var(--gold) 0%, var(--bronze) 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
