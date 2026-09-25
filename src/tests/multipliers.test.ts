import { describe, expect, it } from 'vitest';
import { getMultiplierBreakdown } from '../core/multipliers';
import { createInitialState } from '../core/state';
import type { ModifierSource } from '../data/modifiers';

describe('multiplier pipeline', () => {
  it('computes (base + Σadd) × Πmult and lists every source', () => {
    const sources: ModifierSource[] = [
      { id: 'a', label: 'Add 4', effects: () => ({ qiPerSec: { add: 4 } }) },
      { id: 'b', label: 'Double', effects: () => ({ qiPerSec: { mult: 2 } }) },
      { id: 'c', label: 'Triple', effects: () => ({ qiPerSec: { mult: 3 } }) },
      { id: 'd', label: 'Neutral', effects: () => ({ qiPerSec: { mult: 1, add: 0 } }) },
      { id: 'e', label: 'Other stat', effects: () => ({ qiPerClick: { mult: 100 } }) },
    ];
    const bd = getMultiplierBreakdown(createInitialState(), 'qiPerSec', sources);
    expect(bd.additiveTotal.toNumber()).toBe(5);
    expect(bd.multTotal.toNumber()).toBe(6);
    expect(bd.total.toNumber()).toBe(30);
    expect(bd.entries.map((e) => `${e.id}:${e.kind}`)).toEqual([
      'base:base',
      'a:add',
      'b:mult',
      'c:mult',
    ]);
  });

  it('dev boost flag flows through the real source list', () => {
    const s = createInitialState();
    expect(getMultiplierBreakdown(s, 'qiPerSec').total.toNumber()).toBe(1);
    const boosted = { ...s, flags: { devBoost: true } };
    expect(getMultiplierBreakdown(boosted, 'qiPerSec').total.toNumber()).toBe(1000);
  });
});
