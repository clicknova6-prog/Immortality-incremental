import type { GameState } from '../core/state';
import { qiTick } from './qi';

/** A pure per-tick system. `dt` is in seconds. */
export type TickSystem = (state: GameState, dt: number) => GameState;

/** Order matters: producers first, then anything that reacts to totals. */
export const tickSystems: TickSystem[] = [qiTick];
