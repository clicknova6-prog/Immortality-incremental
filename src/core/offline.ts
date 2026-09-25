import type { Decimal } from './decimal';
import type { GameState } from './state';
import { tick, TICK_SECONDS } from './tick';
import { resources } from '../data/resources';

/** Maximum simulation steps for one offline catch-up (dt grows for long absences). */
export const MAX_OFFLINE_STEPS = 1000;
/** Absences shorter than this are silently simulated without a report. */
export const MIN_REPORT_SECONDS = 10;

export interface ResourceGain {
  id: string;
  name: string;
  icon: string;
  gain: Decimal;
}

export interface OfflineReport {
  /** Seconds actually simulated (after the cap). */
  seconds: number;
  /** Seconds the player was away. */
  awaySeconds: number;
  capped: boolean;
  gains: ResourceGain[];
}

/** Elapsed offline seconds, capped by the state's offline cap. */
export function offlineSeconds(state: GameState, now: number): { seconds: number; away: number } {
  const away = Math.max(0, (now - state.meta.lastSaveAt) / 1000);
  const cap = state.meta.offlineCapHours * 3600;
  return { seconds: Math.min(away, cap), away };
}

/**
 * Simulates `seconds` of play in at most `maxSteps` steps. Short spans use the normal
 * fixed tick; longer spans stretch dt so the step count stays bounded.
 */
export function simulate(
  state: GameState,
  seconds: number,
  maxSteps: number = MAX_OFFLINE_STEPS,
): GameState {
  if (seconds <= 0) return state;
  const steps = Math.min(maxSteps, Math.max(1, Math.ceil(seconds / TICK_SECONDS)));
  const dt = seconds / steps;
  let next = state;
  for (let i = 0; i < steps; i++) next = tick(next, dt);
  return next;
}

export function diffResources(before: GameState, after: GameState): ResourceGain[] {
  return resources
    .map((r) => ({ id: r.id, name: r.name, icon: r.icon, gain: r.get(after).sub(r.get(before)) }))
    .filter((g) => !g.gain.eq(0));
}

/** Applies offline progress and returns the new state plus a report for the UI. */
export function applyOfflineProgress(
  state: GameState,
  now: number,
): { state: GameState; report: OfflineReport | null } {
  const { seconds, away } = offlineSeconds(state, now);
  if (seconds <= 0) return { state, report: null };
  const simulated = simulate(state, seconds);
  const next: GameState = {
    ...simulated,
    stats: { ...simulated.stats, offlineTimeMs: simulated.stats.offlineTimeMs + seconds * 1000 },
    meta: { ...simulated.meta, lastSaveAt: now },
  };
  const report =
    seconds >= MIN_REPORT_SECONDS
      ? { seconds, awaySeconds: away, capped: away > seconds, gains: diffResources(state, next) }
      : null;
  return { state: next, report };
}
