import { describe, expect, it } from 'vitest';
import { runPacingSim } from '../core/pacing';
import { createInitialState } from '../core/state';

describe('pacing simulator', () => {
  it('records when milestones are first reached', () => {
    const result = runPacingSim(createInitialState(0), 1);
    const qi1k = result.hits.find((h) => h.id === 'qi1k');
    expect(qi1k).toBeDefined();
    // 1 Qi/s passive + 5 clicks/s at 1 Qi each = 6 Qi/s -> 1000 Qi at ~167 s
    expect(qi1k!.atSeconds).toBe(167);
  });
});
