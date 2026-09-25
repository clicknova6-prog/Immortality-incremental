import type { GameState } from '../core/state';
import { cultivate } from './qi';

/** Idealized player: how many manual clicks per second it performs. */
export const BOT_CLICKS_PER_SEC = 5;

/**
 * One decision step of the pacing bot, called once per simulated second.
 * Grows with each milestone (buy upgrades, breakthrough, reset when worth it…).
 */
export function botStep(state: GameState): GameState {
  let next = state;
  for (let i = 0; i < BOT_CLICKS_PER_SEC; i++) next = cultivate(next);
  return next;
}
