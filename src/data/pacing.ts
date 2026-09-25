import type { GameState } from '../core/state';

export interface PacingMilestone {
  id: string;
  label: string;
  /** Target time in seconds from a fresh save, from the balance spec. */
  targetSeconds: number | null;
  reached: (state: GameState) => boolean;
}

/** Milestones the pacing simulator watches for. Extended as systems come online. */
export const pacingMilestones: PacingMilestone[] = [
  { id: 'qi1k', label: '1K Qi earned', targetSeconds: null, reached: (s) => s.totalQi.gte(1e3) },
  { id: 'qi1m', label: '1M Qi earned', targetSeconds: null, reached: (s) => s.totalQi.gte(1e6) },
];
