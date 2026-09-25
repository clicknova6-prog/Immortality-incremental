import { D, type Decimal } from './decimal';
import type { Notation } from './format';

export const SAVE_VERSION = 2;

export interface Settings {
  notation: Notation;
  animations: boolean;
  particles: boolean;
  /** Autosave interval in seconds. */
  autosaveSeconds: number;
}

export interface Stats {
  clicks: number;
  /** Online play time in ms. */
  playTimeMs: number;
  /** Total simulated offline time in ms. */
  offlineTimeMs: number;
}

export interface Meta {
  createdAt: number;
  /** Wall-clock time of the last save, used for offline progress. */
  lastSaveAt: number;
  offlineCapHours: number;
}

/**
 * The entire persistent game state. Every numeric resource is a Decimal.
 * Systems treat it as immutable and return new objects.
 */
export interface GameState {
  version: number;
  qi: Decimal;
  /** Qi earned across all runs. */
  totalQi: Decimal;
  /** Qi earned since the last reset (feeds prestige formulas later). */
  qiThisRun: Decimal;
  stats: Stats;
  settings: Settings;
  meta: Meta;
  /** Generic unlock / one-time flags, keyed by id. */
  flags: Record<string, boolean>;
}

export function createInitialState(now: number = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    qi: D(0),
    totalQi: D(0),
    qiThisRun: D(0),
    stats: { clicks: 0, playTimeMs: 0, offlineTimeMs: 0 },
    settings: { notation: 'standard', animations: true, particles: true, autosaveSeconds: 15 },
    meta: { createdAt: now, lastSaveAt: now, offlineCapHours: 12 },
    flags: {},
  };
}
