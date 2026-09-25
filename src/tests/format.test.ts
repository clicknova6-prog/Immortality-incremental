import { describe, expect, it } from 'vitest';
import { D, Decimal } from '../core/decimal';
import { format, formatInt, formatTime } from '../core/format';

describe('format (standard)', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [1.5, '1.5'],
    [0.123, '0.12'],
    [123, '123'],
    [999, '999'],
    [1000, '1.00K'],
    [12_345, '12.3K'],
    [123_456, '123K'],
    [4_560_000, '4.56M'],
    [1e9, '1.00B'],
    [1e12, '1.00T'],
    [1e15, '1.00Qa'],
    [1e18, '1.00Qi'],
    [1e21, '1.00Sx'],
    [1e24, '1.00Sp'],
    [1e27, '1.00Oc'],
    [1e30, '1.00No'],
    [1e33, '1.00Dc'],
    [9.99e35, '999Dc'],
  ])('%s -> %s', (input, expected) => {
    expect(format(input)).toBe(expected);
  });

  it('rolls over instead of showing 1000K', () => {
    expect(format(999_999)).toBe('1.00M');
    expect(format(999.999)).toBe('1.00K');
  });

  it('switches to scientific past Dc', () => {
    expect(format(1e36)).toBe('1.00e36');
    expect(format(1.234e45)).toBe('1.23e45');
    expect(format(D('1e308'))).toBe('1.00e308');
    expect(format(D('5e1000'))).toBe('5.00e1000');
  });

  it('shows e<exponent> for huge numbers', () => {
    expect(format(D('1e1200000000'))).toBe('e1.20e9');
    expect(format(D('1e12000000000'))).toBe('e1.20e10');
    expect(format(D('ee1e5'))).toMatch(/^ee1\.00e5$|^e1\.00e100000$/);
  });

  it('handles negatives, tiny numbers, NaN and infinity', () => {
    expect(format(-12_345)).toBe('-12.3K');
    expect(format(0.0001)).toBe('1.00e-4');
    expect(format(new Decimal(NaN))).toBe('NaN');
    expect(format(new Decimal(Infinity))).toBe('∞');
  });
});

describe('format (scientific)', () => {
  it('uses mantissa/exponent from 1000 up', () => {
    expect(format(999, { notation: 'scientific' })).toBe('999');
    expect(format(1234, { notation: 'scientific' })).toBe('1.23e3');
    expect(format(4.56e6, { notation: 'scientific' })).toBe('4.56e6');
    expect(format(9.999e9, { notation: 'scientific' })).toBe('1.00e10');
  });
});

describe('formatInt / formatTime', () => {
  it('formats integers', () => {
    expect(formatInt(12.9)).toBe('12');
    expect(formatInt(12_900)).toBe('12.9K');
  });
  it('formats durations', () => {
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(59)).toBe('59s');
    expect(formatTime(3725)).toBe('1h 2m 5s');
    expect(formatTime(90061)).toBe('1d 1h 1m');
  });
});
