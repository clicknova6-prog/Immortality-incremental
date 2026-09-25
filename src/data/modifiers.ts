import type { DecimalSource } from '../core/decimal';
import type { GameState } from '../core/state';
import type { Stat } from './stats';

export interface StatEffect {
  /** Added to the base before multipliers. */
  add?: DecimalSource;
  /** Multiplies the total. */
  mult?: DecimalSource;
}

export type StatEffects = Partial<Record<Stat, StatEffect>>;

export interface ModifierSource {
  id: string;
  label: string;
  effects: (state: GameState) => StatEffects;
}

/**
 * Every source of stat modifiers in the game. Systems register their contributions here
 * (upgrades, realms, layers, marks, potions…) so the breakdown tooltip can list them.
 */
export const modifierSources: ModifierSource[] = [
  {
    id: 'devBoost',
    label: 'Heavenly Dev Blessing',
    effects: (s) =>
      s.flags.devBoost ? { qiPerSec: { mult: 1000 }, qiPerClick: { mult: 1000 } } : {},
  },
];
