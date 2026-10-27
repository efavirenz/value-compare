// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultState, loadState, saveState } from './storage';

const KEY = 'value-compare:state:v1';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('storage resilience & hostile payloads (Rule R4)', () => {
  it('returns fallback defaultState when storage is empty', () => {
    expect(loadState()).toEqual(defaultState());
  });

  it('handles null, undefined, and non-object JSON payloads safely', () => {
    localStorage.setItem(KEY, 'null');
    expect(loadState()).toEqual(defaultState());

    localStorage.setItem(KEY, '12345');
    expect(loadState()).toEqual(defaultState());

    localStorage.setItem(KEY, '"string-only"');
    expect(loadState()).toEqual(defaultState());

    localStorage.setItem(KEY, '[]');
    expect(loadState()).toEqual(defaultState());

    localStorage.setItem(KEY, '{ corrupt-json');
    expect(loadState()).toEqual(defaultState());
  });

  it('sanitizes oversized row arrays (> 10 items) and clamps to MAX_ITEMS', () => {
    const hugeRows = Array.from({ length: 1000 }, (_, i) => ({
      price: `${i + 1}`,
      qty: '10',
    }));
    localStorage.setItem(KEY, JSON.stringify({ rows: hugeRows }));

    const loaded = loadState();
    expect(loaded.rows).toHaveLength(10);
    expect(loaded.rows[0].price).toBe('1');
    expect(loaded.rows[9].price).toBe('10');
  });

  it('guarantees MIN_ITEMS (2 rows) when rows array is empty or undersized', () => {
    localStorage.setItem(KEY, JSON.stringify({ rows: [] }));
    expect(loadState().rows).toHaveLength(2);

    localStorage.setItem(KEY, JSON.stringify({ rows: [{ price: '10', qty: '5' }] }));
    const loaded = loadState();
    expect(loaded.rows).toHaveLength(2);
    expect(loaded.rows[0]).toEqual({ price: '10', qty: '5' });
    expect(loaded.rows[1]).toEqual({ price: '', qty: '' });
  });

  it('defends against prototype pollution payloads (__proto__, constructor)', () => {
    const payload = JSON.parse(
      '{"__proto__": {"admin": true}, "constructor": {"prototype": {"polluted": true}}, "unit": "ml"}',
    );
    localStorage.setItem(KEY, JSON.stringify(payload));

    const loaded = loadState();
    expect(loaded.unit).toBe('ml');
    expect((Object.prototype as { polluted?: boolean }).polluted).toBeUndefined();
    expect((Object.prototype as { admin?: boolean }).admin).toBeUndefined();
  });

  it('sanitizes invalid unit, lang, and theme enum values to defaults', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        unit: 'invalid-unit',
        lang: 'fr',
        theme: 'hacker-theme',
      }),
    );
    const loaded = loadState();
    expect(loaded.unit).toBe('g');
    expect(loaded.lang).toBe('en');
    expect(loaded.theme).toBe('paper');
  });

  it('sanitizes oversized strings in rows to MAX_INPUT_LENGTH (12)', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        rows: [{ price: '99999999999999999999', qty: '11111111111111111111' }],
      }),
    );
    const loaded = loadState();
    expect(loaded.rows[0].price).toBe('999999999999');
    expect(loaded.rows[0].qty).toBe('111111111111');
  });

  it('saveState returns false when localStorage throws QuotaExceededError or SecurityError', () => {
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const res = saveState(defaultState());
      expect(res).toBe(false);
    } finally {
      Storage.prototype.setItem = origSetItem;
    }
  });

  it('saveState returns true on successful write', () => {
    const res = saveState(defaultState());
    expect(res).toBe(true);
    expect(localStorage.getItem(KEY)).toBeTruthy();
  });
});
