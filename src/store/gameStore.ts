import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { D, type DecimalSource } from '../core/decimal';
import { setDefaultNotation, type Notation } from '../core/format';
import { diffResources, simulate, type OfflineReport } from '../core/offline';
import { createInitialState, type GameState, type Settings } from '../core/state';
import { runTicks } from '../core/tick';
import { cultivate } from '../systems/qi';

export interface LogEntry {
  id: number;
  at: number;
  text: string;
}

export type PanelId = 'cultivate' | 'settings';

interface UiState {
  panel: PanelId;
  offlineReport: OfflineReport | null;
  log: LogEntry[];
}

interface Actions {
  cultivate: () => void;
  runTicks: (count: number) => void;
  /** Simulates `seconds` of time (offline catch-up or dev time-skip) and shows a report. */
  skipTime: (seconds: number, source: 'offline' | 'dev') => void;
  setPanel: (panel: PanelId) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  loadState: (state: GameState, report?: OfflineReport | null) => void;
  dismissOfflineReport: () => void;
  log: (text: string) => void;
  // dev only
  devAddResource: (id: string, amount: DecimalSource) => void;
  devSetFlag: (flag: string, value: boolean) => void;
}

export interface GameStore {
  game: GameState;
  ui: UiState;
  actions: Actions;
}

const LOG_LIMIT = 50;
let logId = 0;

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    game: createInitialState(),
    ui: { panel: 'cultivate', offlineReport: null, log: [] },
    actions: {
      cultivate: () => set((s) => ({ game: cultivate(s.game) })),
      runTicks: (count) => set((s) => ({ game: runTicks(s.game, count) })),
      skipTime: (seconds, source) => {
        const before = get().game;
        let after = simulate(before, seconds);
        if (source === 'offline') {
          after = {
            ...after,
            stats: { ...after.stats, offlineTimeMs: after.stats.offlineTimeMs + seconds * 1000 },
          };
        }
        const report: OfflineReport = {
          seconds,
          awaySeconds: seconds,
          capped: false,
          gains: diffResources(before, after),
        };
        set((s) => {
          s.game = after;
          s.ui.offlineReport = report;
        });
      },
      setPanel: (panel) =>
        set((s) => {
          s.ui.panel = panel;
        }),
      setSetting: (key, value) => {
        if (key === 'notation') setDefaultNotation(value as Notation);
        set((s) => {
          s.game.settings[key] = value;
        });
      },
      loadState: (state, report = null) => {
        setDefaultNotation(state.settings.notation);
        set((s) => {
          s.game = state;
          s.ui.offlineReport = report;
        });
      },
      dismissOfflineReport: () =>
        set((s) => {
          s.ui.offlineReport = null;
        }),
      log: (text) =>
        set((s) => {
          s.ui.log.unshift({ id: ++logId, at: Date.now(), text });
          s.ui.log.length = Math.min(s.ui.log.length, LOG_LIMIT);
        }),
      devAddResource: (id, amount) =>
        set((s) => {
          if (id === 'qi') {
            s.game.qi = s.game.qi.add(D(amount));
            s.game.totalQi = s.game.totalQi.add(D(amount));
            s.game.qiThisRun = s.game.qiThisRun.add(D(amount));
          }
        }),
      devSetFlag: (flag, value) =>
        set((s) => {
          s.game.flags[flag] = value;
        }),
    },
  })),
);

export const useActions = (): Actions => useGameStore((s) => s.actions);
export const getActions = (): Actions => useGameStore.getState().actions;
