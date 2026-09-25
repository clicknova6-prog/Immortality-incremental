import { Decimal, toDecimal } from './decimal';
import { createInitialState, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'ascension-incremental-save';
/** Decimals are serialized as tagged strings: "$D:1.5e300". */
const DECIMAL_TAG = '$D:';

type RawSave = Record<string, unknown>;
type Migration = (raw: RawSave) => RawSave;

const isRecord = (v: unknown): v is RawSave =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Decimal);

/**
 * `migrations[i]` upgrades a save from version i+1 to i+2.
 * Never edit an existing migration; append a new one and bump SAVE_VERSION.
 */
export const migrations: Migration[] = [
  // v1 -> v2: v1 (prototype) stored a flat `clicks` / `lastSave` and plain-number resources.
  (raw) => {
    const { clicks, lastSave, ...rest } = raw;
    const stats = isRecord(rest.stats) ? rest.stats : {};
    const meta = isRecord(rest.meta) ? rest.meta : {};
    return {
      ...rest,
      stats: { ...stats, clicks: typeof clicks === 'number' ? clicks : 0 },
      meta: { ...meta, lastSaveAt: typeof lastSave === 'number' ? lastSave : Date.now() },
      version: 2,
    };
  },
];

export function serialize(state: GameState): string {
  return JSON.stringify(state, function (this: RawSave, key: string, value: unknown) {
    const original = this[key];
    if (original instanceof Decimal) return DECIMAL_TAG + original.toString();
    return value;
  });
}

function parse(json: string): RawSave {
  const parsed: unknown = JSON.parse(json, (_key, value: unknown) =>
    typeof value === 'string' && value.startsWith(DECIMAL_TAG)
      ? toDecimal(value.slice(DECIMAL_TAG.length))
      : value,
  );
  if (!isRecord(parsed)) throw new Error('Save is not an object');
  return parsed;
}

export function migrate(raw: RawSave): RawSave {
  let version = typeof raw.version === 'number' ? raw.version : 1;
  if (version > SAVE_VERSION) throw new Error(`Save version ${version} is newer than the game`);
  let next = raw;
  while (version < SAVE_VERSION) {
    const step = migrations[version - 1];
    if (!step) throw new Error(`Missing migration from v${version}`);
    next = step(next);
    version += 1;
  }
  return { ...next, version: SAVE_VERSION };
}

/**
 * Overlays raw save data onto a fresh default state, matching types key by key.
 * Missing fields get defaults; Decimal fields accept strings/numbers; unknown keys inside
 * record-like objects (e.g. `flags`) are kept.
 */
function hydrate<T>(defaults: T, raw: unknown): T {
  if (defaults instanceof Decimal) return toDecimal(raw, defaults) as T;
  if (Array.isArray(defaults)) return (Array.isArray(raw) ? raw : defaults) as T;
  if (isRecord(defaults)) {
    if (!isRecord(raw)) return defaults;
    const out: RawSave = { ...raw };
    for (const key of Object.keys(defaults)) out[key] = hydrate(defaults[key], raw[key]);
    return out as T;
  }
  return (typeof raw === typeof defaults ? raw : defaults) as T;
}

export function deserialize(json: string): GameState {
  const migrated = migrate(parse(json));
  return hydrate(createInitialState(), migrated);
}

// --- base64 export/import (UTF-8 safe) ---

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function exportSave(state: GameState): string {
  return toBase64(serialize(state));
}

/** Throws a readable error if the string is not a valid save. */
export function importSave(b64: string): GameState {
  let json: string;
  try {
    json = fromBase64(b64);
  } catch (e) {
    throw new Error('Not a valid save string (bad base64)', { cause: e });
  }
  try {
    return deserialize(json);
  } catch (e) {
    throw new Error(`Not a valid save string (${e instanceof Error ? e.message : 'unknown'})`, {
      cause: e,
    });
  }
}

// --- storage ---

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function saveToStorage(
  state: GameState,
  storage: KeyValueStorage,
  now = Date.now(),
): GameState {
  const stamped: GameState = { ...state, meta: { ...state.meta, lastSaveAt: now } };
  storage.setItem(SAVE_KEY, serialize(stamped));
  return stamped;
}

/** Returns null when there is no save; throws if the save is corrupt. */
export function loadFromStorage(storage: KeyValueStorage): GameState | null {
  const json = storage.getItem(SAVE_KEY);
  return json ? deserialize(json) : null;
}

export function clearStorage(storage: KeyValueStorage): void {
  storage.removeItem(SAVE_KEY);
}
