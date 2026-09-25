import { TICK_MS } from './tick';

/** UI commits are batched to at most 10 per second. */
export const COMMIT_MS = 100;
/** Background (hidden tab) interval. */
export const HIDDEN_INTERVAL_MS = 1000;
/** Gaps longer than this (e.g. a suspended laptop) go through offline simulation instead. */
export const LONG_GAP_MS = 60_000;

export interface LoopCallbacks {
  /** Run `count` fixed ticks and commit the result once. */
  onTicks: (count: number) => void;
  /** Called with the gap length in seconds when the loop was stalled for a long time. */
  onLongGap: (seconds: number) => void;
}

/**
 * Accumulates real time and converts it into fixed 50 ms ticks. The scheduling
 * (RAF vs. interval) is separate from `advance` so the timing logic is testable.
 */
export class TickAccumulator {
  private last: number | null = null;
  private acc = 0;

  constructor(
    private readonly callbacks: LoopCallbacks,
    private readonly minCommitMs: number = COMMIT_MS,
  ) {}

  reset(now: number): void {
    this.last = now;
  }

  /** Returns the number of ticks run. */
  advance(now: number): number {
    if (this.last === null) {
      this.last = now;
      return 0;
    }
    const delta = now - this.last;
    this.last = now;
    if (delta <= 0) return 0;
    if (delta >= LONG_GAP_MS) {
      this.callbacks.onLongGap(delta / 1000);
      return 0;
    }
    this.acc += delta;
    if (this.acc < this.minCommitMs) return 0;
    const count = Math.floor(this.acc / TICK_MS);
    this.acc -= count * TICK_MS;
    if (count > 0) this.callbacks.onTicks(count);
    return count;
  }
}

/** Drives a TickAccumulator with requestAnimationFrame, or setInterval while hidden. */
export class GameLoop {
  private readonly accumulator: TickAccumulator;
  private rafId: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(callbacks: LoopCallbacks) {
    this.accumulator = new TickAccumulator(callbacks);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.accumulator.reset(performance.now());
    document.addEventListener('visibilitychange', this.onVisibility);
    this.schedule();
  }

  stop(): void {
    this.running = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.clear();
  }

  private readonly onVisibility = (): void => {
    this.clear();
    if (this.running) this.schedule();
  };

  private schedule(): void {
    if (document.hidden) {
      this.intervalId = setInterval(
        () => this.accumulator.advance(performance.now()),
        HIDDEN_INTERVAL_MS,
      );
    } else {
      const frame = (): void => {
        this.accumulator.advance(performance.now());
        this.rafId = requestAnimationFrame(frame);
      };
      this.rafId = requestAnimationFrame(frame);
    }
  }

  private clear(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.intervalId !== null) clearInterval(this.intervalId);
    this.rafId = null;
    this.intervalId = null;
  }
}
