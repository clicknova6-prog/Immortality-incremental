import { describe, expect, it } from 'vitest';
import { costAt, costForCount, maxAffordable } from '../core/cost';
import { D } from '../core/decimal';

function loopMax(budget: number, base: number, growth: number, level: number): number {
  let n = 0;
  let spent = 0;
  for (;;) {
    const c = base * growth ** (level + n);
    if (spent + c > budget) return n;
    spent += c;
    n++;
  }
}

describe('cost formulas', () => {
  it('costAt is base × growth^level', () => {
    expect(costAt(10, 1.15, 0).toNumber()).toBeCloseTo(10);
    expect(costAt(10, 1.15, 10).toNumber()).toBeCloseTo(10 * 1.15 ** 10);
  });

  it('costForCount equals summing individual levels', () => {
    let sum = 0;
    for (let i = 5; i < 15; i++) sum += 10 * 1.15 ** i;
    expect(costForCount(10, 1.15, 5, 10).toNumber()).toBeCloseTo(sum, 6);
    expect(costForCount(10, 1.15, 5, 0).toNumber()).toBe(0);
  });

  it.each([
    [1000, 10, 1.15, 0],
    [123_456, 10, 1.15, 7],
    [1e6, 25, 1.5, 3],
    [9.99, 10, 1.15, 0],
  ])(
    'maxAffordable(budget=%s, base=%s, growth=%s, level=%s) matches a loop',
    (budget, base, growth, level) => {
      const result = maxAffordable(budget, base, growth, level);
      expect(result.count).toBe(loopMax(budget, base, growth, level));
      expect(result.cost.lte(budget)).toBe(true);
    },
  );

  it('respects maxLevel', () => {
    expect(maxAffordable(1e12, 10, 1.15, 3, 10).count).toBe(7);
    expect(maxAffordable(1e12, 10, 1.15, 10, 10).count).toBe(0);
  });

  it('works beyond 1e308', () => {
    const r = maxAffordable(D('1e500'), 10, 2, 0);
    expect(r.count).toBeGreaterThan(1600);
    expect(r.cost.lte(D('1e500'))).toBe(true);
  });
});
