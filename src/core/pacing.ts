import type { GameState } from './state';
import { tick } from './tick';
import { pacingMilestones, type PacingMilestone } from '../data/pacing';
import { botStep } from '../systems/bot';

export interface PacingHit {
  id: string;
  label: string;
  atSeconds: number;
  targetSeconds: number | null;
}

export interface PacingResult {
  hits: PacingHit[];
  missed: PacingMilestone[];
  finalState: GameState;
}

/**
 * Runs the idealized bot for `hours` of game time with 1-second steps and records
 * the first time each milestone is reached.
 */
export function runPacingSim(
  start: GameState,
  hours: number,
  milestones: readonly PacingMilestone[] = pacingMilestones,
): PacingResult {
  const totalSeconds = Math.floor(hours * 3600);
  const pending = new Set(milestones);
  const hits: PacingHit[] = [];
  let state = start;
  for (let t = 1; t <= totalSeconds && pending.size > 0; t++) {
    state = tick(botStep(state), 1);
    for (const m of pending) {
      if (m.reached(state)) {
        hits.push({ id: m.id, label: m.label, atSeconds: t, targetSeconds: m.targetSeconds });
        pending.delete(m);
      }
    }
  }
  return { hits, missed: [...pending], finalState: state };
}
