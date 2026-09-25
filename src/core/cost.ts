import { D, Decimal, type DecimalSource } from './decimal';

/** Cost of the next level: base × growth^level. */
export function costAt(base: DecimalSource, growth: DecimalSource, level: DecimalSource): Decimal {
  return D(base).mul(Decimal.pow(growth, level));
}

/** Total cost of buying `count` levels starting at `level` (geometric series). */
export function costForCount(
  base: DecimalSource,
  growth: DecimalSource,
  level: DecimalSource,
  count: DecimalSource,
): Decimal {
  if (D(count).lte(0)) return D(0);
  return Decimal.sumGeometricSeries(count, base, growth, level);
}

export interface MaxBuy {
  count: number;
  cost: Decimal;
}

/**
 * How many levels can be bought with `budget`, using the closed-form geometric series
 * (no per-level loop). Respects an optional max level.
 */
export function maxAffordable(
  budget: DecimalSource,
  base: DecimalSource,
  growth: DecimalSource,
  level: number,
  maxLevel: number | null = null,
): MaxBuy {
  let count = Decimal.affordGeometricSeries(budget, base, growth, level).floor().toNumber();
  if (!Number.isFinite(count) || count < 0) count = 0;
  if (maxLevel !== null) count = Math.min(count, Math.max(0, maxLevel - level));
  // Guard against floating-point overshoot at the boundary.
  while (count > 0 && costForCount(base, growth, level, count).gt(budget)) count--;
  return { count, cost: costForCount(base, growth, level, count) };
}
