import { describe, expect, it } from 'vitest';
import {
  chooseDecimals,
  formatPercent,
  formatUnitPrice,
  normalizeNumberText,
  parsePositive,
  rankItems,
  sanitizeNumber,
} from './logic';

describe('sanitizeNumber', () => {
  it('normalizes decimal comma and keeps thousands separators', () => {
    expect(sanitizeNumber('1,5')).toBe('1.5');
    expect(sanitizeNumber('1,50')).toBe('1.50');
    expect(sanitizeNumber('1,')).toBe('1.');
    expect(sanitizeNumber('1,000')).toBe('1000');
    expect(sanitizeNumber('1,250.50')).toBe('1250.50');
    expect(sanitizeNumber('1.2.3')).toBe('1.23');
    expect(sanitizeNumber('١٢abc.5')).toBe('.5');
  });

  it('converts Thai numerals to Arabic digits', () => {
    expect(sanitizeNumber('๑๒.๕')).toBe('12.5');
    expect(sanitizeNumber('๑,๐๐๐')).toBe('1000');
    expect(sanitizeNumber('๒๕๐')).toBe('250');
  });
});

describe('parsePositive', () => {
  it('rejects empty, dot and zero', () => {
    expect(parsePositive('')).toBeNull();
    expect(parsePositive('.')).toBeNull();
    expect(parsePositive('0')).toBeNull();
    expect(parsePositive('0.0')).toBeNull();
    expect(parsePositive('.5')).toBe(0.5);
    expect(parsePositive('5.')).toBe(5);
  });
});

describe('normalizeNumberText', () => {
  it('trims zeros', () => {
    expect(normalizeNumberText('012.500')).toBe('12.5');
    expect(normalizeNumberText('.5')).toBe('0.5');
    expect(normalizeNumberText('5.')).toBe('5');
  });
});

describe('rankItems', () => {
  it('matches the example in the brief', () => {
    const ranked = rankItems([
      { price: '10', qty: '10' },
      { price: '15', qty: '20' },
      { price: '25', qty: '31.25' },
    ]);
    expect(ranked.map((r) => [r.label, r.rank])).toEqual([
      ['B', 1],
      ['C', 2],
      ['A', 3],
    ]);
    const decimals = chooseDecimals(ranked.map((r) => r.unitPrice));
    expect(ranked.map((r) => formatUnitPrice(r.unitPrice, decimals))).toEqual(['0.75', '0.80', '1.00']);
    expect(formatPercent(ranked[0].pct)).toBe('0%');
    expect(Math.round(ranked[1].pct)).toBe(7);
    expect(Math.round(ranked[2].pct)).toBe(33);
  });

  it('uses competition ranking for ties', () => {
    const ranked = rankItems([
      { price: '10', qty: '10' },
      { price: '20', qty: '20' },
      { price: '30', qty: '20' },
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(ranked[1].pct).toBe(0);
  });

  it('treats floating point noise as equal', () => {
    const ranked = rankItems([
      { price: '0.3', qty: '1' },
      { price: '0.1', qty: '0.33333333333333' },
    ]);
    expect(ranked).toHaveLength(2);
    const third = rankItems([
      { price: '3', qty: '10' },
      { price: '0.3', qty: '1' },
    ]);
    expect(third.map((r) => r.rank)).toEqual([1, 1]);
  });

  it('ignores incomplete rows and needs two complete rows', () => {
    expect(rankItems([{ price: '10', qty: '' }, { price: '5', qty: '5' }])).toEqual([]);
    expect(rankItems([{ price: '10', qty: '0' }, { price: '5', qty: '5' }])).toEqual([]);
    expect(
      rankItems([
        { price: '10', qty: '10' },
        { price: '.', qty: '5' },
        { price: '5', qty: '10' },
      ]).map((r) => r.label),
    ).toEqual(['C', 'A']);
  });
});

describe('formatting', () => {
  it('uses adaptive decimals for tiny unit prices', () => {
    expect(chooseDecimals([0.0045, 0.006])).toBe(4);
  });

  it('adds decimals until different values look different', () => {
    const d = chooseDecimals([0.75, 0.7501]);
    expect(d).toBeGreaterThanOrEqual(4);
    expect(formatUnitPrice(0.75, d)).not.toBe(formatUnitPrice(0.7501, d));
  });

  it('formats percentages', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.01)).toBe('+<0.1%');
    expect(formatPercent(0.3)).toBe('+0.3%');
    expect(formatPercent(6.6667)).toBe('+6.7%');
    expect(formatPercent(5)).toBe('+5%');
    expect(formatPercent(33.33)).toBe('+33%');
  });

  it('avoids scientific notation for extreme numbers', () => {
    expect(formatUnitPrice(1e22, 2)).not.toContain('e');
  });
});
