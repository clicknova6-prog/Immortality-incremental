import { GameLoop } from './loop';
import { applyOfflineProgress } from './offline';
import { loadFromStorage, SAVE_KEY, saveToStorage } from './save';
import { createInitialState } from './state';
import { getActions, useGameStore } from '../store/gameStore';

const CORRUPT_BACKUP_KEY = `${SAVE_KEY}-corrupt-backup`;

/**
 * Boots the game: load save → apply offline progress → start the loop and autosave.
 * Returns a teardown function.
 */
export function startEngine(storage: Storage = window.localStorage): () => void {
  const actions = getActions();

  let loaded = null;
  try {
    loaded = loadFromStorage(storage);
  } catch (e) {
    console.error('Failed to load save', e);
    const raw = storage.getItem(SAVE_KEY);
    if (raw) storage.setItem(CORRUPT_BACKUP_KEY, raw);
    actions.log(`⚠️ Your save could not be read. A backup was kept under "${CORRUPT_BACKUP_KEY}".`);
  }
  if (loaded) {
    const { state, report } = applyOfflineProgress(loaded, Date.now());
    actions.loadState(state, report);
    actions.log('Welcome back, cultivator.');
  } else {
    actions.loadState(createInitialState());
    actions.log('Your cultivation journey begins.');
  }

  const save = (): void => saveNow(storage);

  const loop = new GameLoop({
    onTicks: (count) => actions.runTicks(count),
    onLongGap: (seconds) => actions.skipTime(seconds, 'offline'),
  });
  loop.start();

  let autosaveSeconds = useGameStore.getState().game.settings.autosaveSeconds;
  let autosave = setInterval(save, autosaveSeconds * 1000);
  const unsubscribe = useGameStore.subscribe((s) => {
    if (s.game.settings.autosaveSeconds !== autosaveSeconds) {
      autosaveSeconds = s.game.settings.autosaveSeconds;
      clearInterval(autosave);
      autosave = setInterval(save, autosaveSeconds * 1000);
    }
  });
  window.addEventListener('beforeunload', save);

  return () => {
    loop.stop();
    clearInterval(autosave);
    unsubscribe();
    window.removeEventListener('beforeunload', save);
  };
}

/** Saves immediately (used by the Settings panel). */
export function saveNow(storage: Storage = window.localStorage): void {
  const stamped = saveToStorage(useGameStore.getState().game, storage);
  useGameStore.setState((s) => {
    s.game.meta.lastSaveAt = stamped.meta.lastSaveAt;
  });
}

/** Replaces the game with a fresh state and overwrites the stored save. */
export function hardReset(storage: Storage = window.localStorage): void {
  const fresh = createInitialState();
  getActions().loadState(fresh);
  saveToStorage(fresh, storage);
  getActions().log('The world has been reborn from nothing.');
}
