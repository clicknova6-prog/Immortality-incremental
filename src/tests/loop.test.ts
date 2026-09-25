import { describe, expect, it } from 'vitest';
import { COMMIT_MS, LONG_GAP_MS, TickAccumulator } from '../core/loop';
import { TICK_MS } from '../core/tick';

function setup() {
  const calls = { ticks: [] as number[], gaps: [] as number[] };
  const acc = new TickAccumulator({
    onTicks: (n) => calls.ticks.push(n),
    onLongGap: (s) => calls.gaps.push(s),
  });
  acc.reset(0);
  return { acc, calls };
}

describe('TickAccumulator', () => {
  it('batches commits to at most one per 100 ms', () => {
    const { acc, calls } = setup();
    // 60 fps for one second
    for (let t = 16; t <= 1000; t += 16) acc.advance(t);
    expect(calls.ticks.length).toBeLessThanOrEqual(1000 / COMMIT_MS);
    const total = calls.ticks.reduce((a, b) => a + b, 0);
    // Anything under one commit window may still be held back.
    expect(total * TICK_MS).toBeLessThanOrEqual(992);
    expect(total * TICK_MS).toBeGreaterThan(992 - COMMIT_MS);
  });

  it('carries leftover time between commits (no drift)', () => {
    const { acc, calls } = setup();
    for (let t = 130; t <= 13_000; t += 130) acc.advance(t);
    const total = calls.ticks.reduce((a, b) => a + b, 0);
    expect(total).toBe(13_000 / TICK_MS);
  });

  it('handles the 1 s hidden-tab interval', () => {
    const { acc, calls } = setup();
    acc.advance(1000);
    expect(calls.ticks).toEqual([20]);
  });

  it('routes long stalls to offline simulation', () => {
    const { acc, calls } = setup();
    acc.advance(LONG_GAP_MS + 5000);
    expect(calls.gaps).toEqual([(LONG_GAP_MS + 5000) / 1000]);
    expect(calls.ticks).toEqual([]);
  });
});
