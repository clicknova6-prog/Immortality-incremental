import Decimal, { type DecimalSource } from 'break_eternity.js';

export { Decimal };
export type { DecimalSource };

/** Shorthand constructor. Always returns a fresh Decimal. */
export const D = (value: DecimalSource): Decimal => new Decimal(value);

export const ZERO = D(0);
export const ONE = D(1);

/** True when the value is a finite, non-NaN Decimal. */
export function isFiniteDecimal(value: Decimal): boolean {
  return !Number.isNaN(value.mag) && Number.isFinite(value.mag) && Number.isFinite(value.layer);
}

/** Parses anything into a Decimal, falling back when the input is missing or invalid. */
export function toDecimal(value: unknown, fallback: DecimalSource = 0): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    const d = D(value);
    if (isFiniteDecimal(d)) return d;
  }
  return D(fallback);
}

export const dmax = (a: DecimalSource, b: DecimalSource): Decimal => Decimal.max(a, b);
export const dmin = (a: DecimalSource, b: DecimalSource): Decimal => Decimal.min(a, b);
