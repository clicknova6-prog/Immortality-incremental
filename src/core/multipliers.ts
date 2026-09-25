import { D, type Decimal } from './decimal';
import type { GameState } from './state';
import { baseStats, type Stat } from '../data/stats';
import { modifierSources, type ModifierSource } from '../data/modifiers';

export interface BreakdownEntry {
  id: string;
  label: string;
  kind: 'base' | 'add' | 'mult';
  value: Decimal;
}

export interface Breakdown {
  stat: Stat;
  /** base + Σ additive sources */
  additiveTotal: Decimal;
  /** Π multiplicative sources */
  multTotal: Decimal;
  total: Decimal;
  entries: BreakdownEntry[];
}

/**
 * Computes `(base + Σadd) × Πmult` for a stat and returns each contributing source.
 * This powers the "Why is my Qi/s this number?" tooltip.
 */
export function getMultiplierBreakdown(
  state: GameState,
  stat: Stat,
  sources: readonly ModifierSource[] = modifierSources,
): Breakdown {
  const entries: BreakdownEntry[] = [
    { id: 'base', label: 'Base', kind: 'base', value: D(baseStats[stat]) },
  ];
  let additiveTotal = D(baseStats[stat]);
  let multTotal = D(1);

  for (const source of sources) {
    const effect = source.effects(state)[stat];
    if (!effect) continue;
    if (effect.add !== undefined && !D(effect.add).eq(0)) {
      const value = D(effect.add);
      additiveTotal = additiveTotal.add(value);
      entries.push({ id: source.id, label: source.label, kind: 'add', value });
    }
    if (effect.mult !== undefined && !D(effect.mult).eq(1)) {
      const value = D(effect.mult);
      multTotal = multTotal.mul(value);
      entries.push({ id: source.id, label: source.label, kind: 'mult', value });
    }
  }

  return { stat, additiveTotal, multTotal, total: additiveTotal.mul(multTotal), entries };
}

export function getStat(state: GameState, stat: Stat): Decimal {
  return getMultiplierBreakdown(state, stat).total;
}
