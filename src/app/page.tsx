'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeneratorControls } from '@/components/GeneratorControls';
import { LootResults } from '@/components/LootResults';
import {
  GeneratorFormState,
  LootGenerationResult,
  DEFAULT_FORM_STATE,
  formStateToConfig,
  Dataset,
} from '@/lib/types';
import { loadDataset } from '@/lib/dataset';
import { generateLoot, rerollItem } from '@/lib/generator';

export default function Home() {
  // State
  const [formState, setFormState] = useState<GeneratorFormState>(DEFAULT_FORM_STATE);
  const [result, setResult] = useState<LootGenerationResult | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load dataset on mount
  useEffect(() => {
    loadDataset()
      .then(setDataset)
      .catch((err) => setError(`Failed to load dataset: ${err.message}`));
  }, []);

  // Form change handler
  const handleFormChange = useCallback((updates: Partial<GeneratorFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Generate loot handler
  const handleGenerate = useCallback(() => {
    if (!dataset) return;

    setIsLoading(true);
    setError(null);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const config = formStateToConfig(formState);
        const newResult = generateLoot(dataset, config);
        setResult(newResult);
      } catch (err) {
        setError(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }, 50);
  }, [dataset, formState]);

  // Reroll single item handler
  const handleRerollItem = useCallback(
    (index: number) => {
      if (!dataset || !result) return;

      const config = formStateToConfig(formState);
      const newResult = rerollItem(dataset, config, result.items, index);
      setResult(newResult);
    },
    [dataset, formState, result]
  );

  // Reroll all handler
  const handleRerollAll = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Copy to clipboard handler
  const handleCopy = useCallback(() => {
    if (!result) return;

    const text = result.items
      .map((item) => {
        let line = `${item.displayName} - ${item.totalCost.toLocaleString()} gp`;
        if (item.isGenerated && item.magicQualities.length > 0) {
          line += `\n  Qualities: ${item.magicQualities.map((q) => q.name).join(', ')}`;
        }
        return line;
      })
      .join('\n\n');

    const summary = `\n\n---\nTotal Value: ${result.totalValue.toLocaleString()} gp`;

    navigator.clipboard.writeText(text + summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  return (
    <main className="min-h-screen py-8 px-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider mb-2" style={{ color: 'var(--gold)' }}>
          DND 3.5 Loot Generator
        </h1>
        <p className="text-lg opacity-70">
          Generate random treasure for your adventures
        </p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Copy Notification */}
      {copied && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-800 text-green-100 rounded shadow-lg animate-fade-in">
          Copied to clipboard!
        </div>
      )}

      {/* Loading Overlay */}
      {!dataset && !error && (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent" />
          <p className="mt-4 opacity-70">Loading dataset...</p>
        </div>
      )}

      {/* Main Content */}
      {dataset && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Panel - Controls */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <GeneratorControls
              formState={formState}
              onFormChange={handleFormChange}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </aside>

          {/* Right Panel - Results */}
          <section>
            <LootResults
              result={result}
              onRerollItem={handleRerollItem}
              onRerollAll={handleRerollAll}
              onCopy={handleCopy}
            />
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-panel-border text-center text-sm opacity-50">
        <p>DND 3.5 Loot Generator • Built for Dungeon Masters</p>
      </footer>
    </main>
  );
}
