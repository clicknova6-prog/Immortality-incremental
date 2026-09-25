/** Every stat that flows through the multiplier pipeline. */
export type Stat = 'qiPerSec' | 'qiPerClick';

export const statLabels: Record<Stat, string> = {
  qiPerSec: 'Qi / sec',
  qiPerClick: 'Qi / click',
};

/** Base value before any additive or multiplicative sources. */
export const baseStats: Record<Stat, number> = {
  qiPerSec: 1,
  qiPerClick: 1,
};
