import { describe, expect, it } from 'vitest';
import { D } from '../core/decimal';
import { applyOfflineProgress, MAX_OFFLINE_STEPS, offlineSeconds, simulate } from '../core/offline';
import { createInitialState, type GameState } from '../core/state';
import { runTicks, tick, TICK_SECONDS } from '../core/tick';
import type { TickSystem } from '../systems';

const NOW = 1_700_000_000_000;

function relClose(a: number, b: number, tolerance = 0.01): void {
  expect(Math.abs(a - b) / Math.max(Math.abs(b), 1e-12)).toBeLessThanOrEqual(tolerance);
}

describe('offline progress', () => {
  it('equals the same time simulated online (±1%)', () => {
    const start = createInitialState(NOW);
    const seconds = 2 * 3600;
    const online = runTicks(start, seconds / TICK_SECONDS);
    const offline = simulate(start, seconds);
    relClose(offline.qi.toNumber(), online.qi.toNumber());
    relClose(offline.totalQi.toNumber(), online.totalQi.toNumber());
  });

  it('stays within ±1% for compounding growth with bounded steps', () => {
    // A stand-in compounding system: +0.01% of current Qi per second, plus 1/s.
    const compounding: TickSystem = (s, dt) => ({
      ...s,
      qi: s.qi.add(s.qi.mul(1e-4 * dt)).add(dt),
    });
    const start: GameState = { ...createInitialState(NOW), qi: D(1000) };
    const seconds = 3600;
    let online = start;
    for (let i = 0; i < seconds / TICK_SECONDS; i++)
      online = tick(online, TICK_SECONDS, [compounding]);
    const steps = MAX_OFFLINE_STEPS;
    let offline = start;
    for (let i = 0; i < steps; i++) offline = tick(offline, seconds / steps, [compounding]);
    relClose(offline.qi.toNumber(), online.qi.toNumber());
  });

  it('caps elapsed time at the offline cap', () => {
    const s = createInitialState(NOW);
    const { seconds, away } = offlineSeconds(s, NOW + 20 * 3600 * 1000);
    expect(away).toBe(20 * 3600);
    expect(seconds).toBe(12 * 3600);
  });

  it('produces a report with gains and advances lastSaveAt', () => {
    const s = createInitialState(NOW);
    const later = NOW + 600_000;
    const { state, report } = applyOfflineProgress(s, later);
    expect(state.meta.lastSaveAt).toBe(later);
    expect(state.stats.offlineTimeMs).toBe(600_000);
    expect(report?.seconds).toBe(600);
    expect(report?.capped).toBe(false);
    const qi = report?.gains.find((g) => g.id === 'qi');
    relClose(qi!.gain.toNumber(), 600);
  });

  it('skips the report for very short absences', () => {
    const { report } = applyOfflineProgress(createInitialState(NOW), NOW + 3000);
    expect(report).toBeNull();
  });

  it('does nothing when the clock went backwards', () => {
    const s = createInitialState(NOW);
    const { state, report } = applyOfflineProgress(s, NOW - 10_000);
    expect(state).toBe(s);
    expect(report).toBeNull();
  });
});
