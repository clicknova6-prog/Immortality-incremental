import type { GameState } from './state';
import { tickSystems, type TickSystem } from '../systems';

/** Fixed logical tick length. */
export const TICK_MS = 50;
export const TICK_SECONDS = TICK_MS / 1000;

/** Advances the simulation by `dt` seconds through every registered system. */
export function tick(
  state: GameState,
  dt: number,
  systems: readonly TickSystem[] = tickSystems,
): GameState {
  let next = state;
  for (const system of systems) next = system(next, dt);
  return next;
}

/** Runs `count` fixed ticks of online play. */
export function runTicks(state: GameState, count: number): GameState {
  let next = state;
  for (let i = 0; i < count; i++) next = tick(next, TICK_SECONDS);
  return {
    ...next,
    stats: { ...next.stats, playTimeMs: next.stats.playTimeMs + count * TICK_MS },
  };
}
