import { describe, expect, it } from 'vitest';
import { mulberry32, weightedIndex } from '../core/rng';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('weightedIndex', () => {
  it('matches weights over 100k seeded rolls', () => {
    const rand = mulberry32(1234);
    const weights = [60, 25, 10, 5];
    const counts = [0, 0, 0, 0];
    const N = 100_000;
    for (let i = 0; i < N; i++) counts[weightedIndex(weights, rand)]! += 1;
    weights.forEach((w, i) => expect(counts[i]! / N).toBeCloseTo(w / 100, 2));
  });

  it('never picks zero-weight entries', () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 1000; i++) expect(weightedIndex([0, 1, 0], rand)).toBe(1);
  });
});
