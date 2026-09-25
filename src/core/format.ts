import { D, Decimal, type DecimalSource } from './decimal';

export type Notation = 'standard' | 'scientific';

/** Suffix for each power of 1000. Index 11 (Dc) = 1e33. */
export const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;

/** Beyond this, standard notation switches to scientific. */
const STANDARD_LIMIT_EXP = SUFFIXES.length * 3; // 1e36
/** Beyond this exponent, show `e<formatted exponent>` instead of `m e<exponent>`. */
const HUGE_EXP = 1e9;

let defaultNotation: Notation = 'standard';
export function setDefaultNotation(notation: Notation): void {
  defaultNotation = notation;
}

export interface FormatOptions {
  notation?: Notation;
  /** Decimal places for small numbers (< 1000). Default 2. */
  places?: number;
}

/** Mantissa with 3 significant digits: 1.23 / 12.3 / 123. */
function threeSig(m: number): string {
  if (m < 10) return m.toFixed(2);
  if (m < 100) return m.toFixed(1);
  return m.toFixed(0);
}

function formatSmall(n: number, places: number): string {
  if (n === 0) return '0';
  if (n < 10 ** -places) {
    const e = Math.floor(Math.log10(n));
    return `${(n / 10 ** e).toFixed(2)}e${e}`;
  }
  // Trim trailing zeros: 1.50 -> 1.5, 3.00 -> 3
  return String(Number(n.toFixed(places)));
}

function formatScientific(d: Decimal, notation: Notation): string {
  if (d.layer >= 4) return d.toString();
  const exponentD = d.log10().floor();
  if (exponentD.gte(HUGE_EXP)) {
    return `e${format(d.log10(), { notation: notation === 'standard' ? 'scientific' : notation })}`;
  }
  let e = exponentD.toNumber();
  let m = d.div(Decimal.pow(10, e)).toNumber();
  if (Number(m.toFixed(2)) >= 10) {
    m /= 10;
    e += 1;
  }
  return `${m.toFixed(2)}e${e}`;
}

/**
 * Formats any Decimal for display:
 *   123 · 12.3K · 4.56M … 999Dc · 1.23e45 · e1.23e10
 */
export function format(value: DecimalSource, opts: FormatOptions = {}): string {
  const notation = opts.notation ?? defaultNotation;
  const places = opts.places ?? 2;
  const d = D(value);

  if (Number.isNaN(d.mag)) return 'NaN';
  if (d.sign < 0) return `-${format(d.neg(), opts)}`;
  if (!Number.isFinite(d.mag) || !Number.isFinite(d.layer)) return '∞';

  if (d.lt(1000)) {
    const small = formatSmall(d.toNumber(), places);
    // Rounding can push 999.999 to 1000; fall through to the big-number path.
    if (Number(small) < 1000) return small;
  }

  if (notation === 'scientific') return formatScientific(d, notation);

  const exp = d.log10().floor().toNumber();
  if (exp >= STANDARD_LIMIT_EXP) return formatScientific(d, notation);

  let tier = Math.floor(exp / 3);
  let m = d.div(Decimal.pow(1000, tier)).toNumber();
  if (Number(threeSig(m)) >= 1000) {
    tier += 1;
    m /= 1000;
  }
  if (tier >= SUFFIXES.length) return formatScientific(d, notation);
  return `${threeSig(m)}${SUFFIXES[tier]}`;
}

/** Formats an integer-ish count (no decimals below 1000). */
export function formatInt(value: DecimalSource, opts: FormatOptions = {}): string {
  return format(D(value).floor(), { ...opts, places: 0 });
}

/** 3725 -> "1h 2m 5s"; 90061 -> "1d 1h 1m". */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return '∞';
  let s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!d && (s || parts.length === 0)) parts.push(`${s}s`);
  return parts.join(' ');
}
