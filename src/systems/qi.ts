import type { Decimal } from '../core/decimal';
import { getStat } from '../core/multipliers';
import type { GameState } from '../core/state';

export function gainQi(state: GameState, amount: Decimal): GameState {
  return {
    ...state,
    qi: state.qi.add(amount),
    totalQi: state.totalQi.add(amount),
    qiThisRun: state.qiThisRun.add(amount),
  };
}

/** Passive Qi generation. */
export function qiTick(state: GameState, dt: number): GameState {
  return gainQi(state, getStat(state, 'qiPerSec').mul(dt));
}

/** One manual cultivate click. */
export function cultivate(state: GameState): GameState {
  const next = gainQi(state, getStat(state, 'qiPerClick'));
  return { ...next, stats: { ...next.stats, clicks: next.stats.clicks + 1 } };
}
