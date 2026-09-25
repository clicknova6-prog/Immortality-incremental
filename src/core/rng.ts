/** Deterministic 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks an index proportionally to `weights`. Weights need not be normalized. */
export function weightedIndex(weights: readonly number[], rand: () => number): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return 0;
  let roll = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= Math.max(0, weights[i] ?? 0);
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

/** A non-deterministic seed for live play. */
export function randomSeed(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}
