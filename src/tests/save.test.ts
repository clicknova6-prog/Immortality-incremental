import { describe, expect, it } from 'vitest';
import { D } from '../core/decimal';
import {
  deserialize,
  exportSave,
  importSave,
  loadFromStorage,
  migrate,
  saveToStorage,
  serialize,
  type KeyValueStorage,
} from '../core/save';
import { createInitialState, SAVE_VERSION, type GameState } from '../core/state';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function sample(): GameState {
  const s = createInitialState(1_700_000_000_000);
  return {
    ...s,
    qi: D('1.5e400'),
    totalQi: D('3e400'),
    qiThisRun: D(12345.5),
    stats: { clicks: 42, playTimeMs: 1000, offlineTimeMs: 5 },
    settings: { ...s.settings, notation: 'scientific' },
    flags: { waterfallSecret: true },
  };
}

describe('save / load', () => {
  it('stores Decimals as tagged strings', () => {
    const json = serialize(sample());
    expect(json).toMatch(/"qi":"\$D:1\.5\d*e400"/);
  });

  it('round-trips through serialize/deserialize', () => {
    const original = sample();
    const loaded = deserialize(serialize(original));
    expect(loaded.qi.eq(original.qi)).toBe(true);
    expect(loaded.totalQi.eq(original.totalQi)).toBe(true);
    expect(loaded.qiThisRun.eq(original.qiThisRun)).toBe(true);
    expect(loaded.stats).toEqual(original.stats);
    expect(loaded.settings).toEqual(original.settings);
    expect(loaded.flags).toEqual(original.flags);
    expect(loaded.meta).toEqual(original.meta);
    expect(serialize(loaded)).toBe(serialize(original));
  });

  it('round-trips through base64 export/import', () => {
    const original = sample();
    const str = exportSave(original);
    expect(str).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(serialize(importSave(str))).toBe(serialize(original));
  });

  it('rejects garbage imports with a readable error', () => {
    expect(() => importSave('!!!not base64!!!')).toThrow(/valid save/);
    expect(() => importSave(btoa('{"version": 999}'))).toThrow(/newer/);
    expect(() => importSave(btoa('[1,2]'))).toThrow(/valid save/);
  });

  it('fills missing fields with defaults', () => {
    const loaded = deserialize(JSON.stringify({ version: SAVE_VERSION, qi: '$D:50' }));
    expect(loaded.qi.toNumber()).toBe(50);
    expect(loaded.totalQi.toNumber()).toBe(0);
    expect(loaded.settings.autosaveSeconds).toBe(15);
  });

  it('falls back to defaults for wrongly typed fields', () => {
    const loaded = deserialize(
      JSON.stringify({ version: SAVE_VERSION, qi: 'banana', stats: { clicks: 'many' } }),
    );
    expect(loaded.qi.toNumber()).toBe(0);
    expect(loaded.stats.clicks).toBe(0);
  });

  it('persists through storage', () => {
    const storage = memoryStorage();
    expect(loadFromStorage(storage)).toBeNull();
    const stamped = saveToStorage(sample(), storage, 1234);
    expect(stamped.meta.lastSaveAt).toBe(1234);
    const loaded = loadFromStorage(storage);
    expect(loaded?.meta.lastSaveAt).toBe(1234);
    expect(loaded?.qi.eq(D('1.5e400'))).toBe(true);
  });
});

describe('migrations', () => {
  const v1 = {
    version: 1,
    qi: '12345',
    totalQi: 99999,
    clicks: 77,
    lastSave: 1_600_000_000_000,
    settings: { notation: 'scientific' },
  };

  it('upgrades a v1 save to the current version', () => {
    const migrated = migrate({ ...v1 });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated).not.toHaveProperty('clicks');
    expect(migrated).not.toHaveProperty('lastSave');
  });

  it('loads a v1 save with every field mapped', () => {
    const loaded = deserialize(JSON.stringify(v1));
    expect(loaded.version).toBe(SAVE_VERSION);
    expect(loaded.qi.toNumber()).toBe(12345);
    expect(loaded.totalQi.toNumber()).toBe(99999);
    expect(loaded.stats.clicks).toBe(77);
    expect(loaded.meta.lastSaveAt).toBe(1_600_000_000_000);
    expect(loaded.settings.notation).toBe('scientific');
    expect(loaded.settings.animations).toBe(true);
  });

  it('treats a save without a version as v1', () => {
    const loaded = deserialize(JSON.stringify({ qi: '5', clicks: 3 }));
    expect(loaded.stats.clicks).toBe(3);
  });
});
