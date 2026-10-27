export const MAX_ITEMS = 10;
export const MIN_ITEMS = 2;
export const MAX_INPUT_LENGTH = 12;
/** Relative tolerance used ONLY to decide whether two unit prices are "equal". Ranking uses full values. */
export const EQUALITY_TOLERANCE = 1e-9;

export type Unit = 'g' | 'ml';

export interface RowData {
  price: string;
  qty: string;
}

export interface RankedItem {
  index: number;
  label: string;
  priceText: string;
  price: number;
  qty: number;
  unitPrice: number;
  rank: number;
  /** Percentage more expensive than the best unit price (0 for rank 1). */
  pct: number;
}

/** Keep only digits 0-9 and a single decimal point, converting Thai numerals and smart-normalizing decimal commas. */
export function sanitizeNumber(raw: string): string {
  // Convert Thai digits (๐-๙) to ASCII (0-9)
  let normalized = '';
  for (const ch of raw) {
    if (ch >= '\u0E50' && ch <= '\u0E59') {
      normalized += String.fromCharCode(ch.charCodeAt(0) - 0x0E50 + 48);
    } else {
      normalized += ch;
    }
  }

  // Handle commas: preserve standard thousands separators; normalize lone decimal commas
  if (normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(normalized.trim())) {
    normalized = normalized.replace(/,/g, '');
  } else {
    const commaCount = (normalized.match(/,/g) || []).length;
    if (commaCount === 1) {
      normalized = normalized.replace(',', '.');
    }
  }

  let out = '';
  let seenDot = false;
  for (const ch of normalized) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '.' && !seenDot) {
      seenDot = true;
      out += ch;
    }
  }
  return out.slice(0, MAX_INPUT_LENGTH);
}

/** Returns a number > 0, or null when the text is empty, "." or zero. */
export function parsePositive(text: string): number | null {
  if (!/^\d*\.?\d*$/.test(text)) return null;
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function itemLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EQUALITY_TOLERANCE * Math.max(Math.abs(a), Math.abs(b));
}

/** "012.500" -> "12.5", ".5" -> "0.5", "5." -> "5" */
export function normalizeNumberText(text: string): string {
  const [intPart = '', fracPart = ''] = text.split('.');
  const int = intPart.replace(/^0+(?=\d)/, '') || '0';
  const frac = fracPart.replace(/0+$/, '');
  return frac ? `${int}.${frac}` : int;
}

/**
 * Ranks complete rows (price > 0 and quantity > 0) by unit price, cheapest first.
 * Competition ranking: equal unit prices share a rank (1, 1, 3). Returns [] if fewer than 2 complete rows.
 */
export function rankItems(rows: RowData[]): RankedItem[] {
  const items: RankedItem[] = [];
  rows.forEach((row, index) => {
    const price = parsePositive(row.price);
    const qty = parsePositive(row.qty);
    if (price === null || qty === null) return;
    items.push({
      index,
      label: itemLabel(index),
      priceText: normalizeNumberText(row.price),
      price,
      qty,
      unitPrice: price / qty,
      rank: 0,
      pct: 0,
    });
  });
  if (items.length < 2) return [];

  items.sort((a, b) => {
    const diff = a.unitPrice - b.unitPrice;
    return diff !== 0 ? diff : a.index - b.index;
  });

  const best = items[0].unitPrice;
  let groupStart = 0;
  items.forEach((item, i) => {
    if (i === 0 || !nearlyEqual(item.unitPrice, items[groupStart].unitPrice)) groupStart = i;
    item.rank = groupStart + 1;
    item.pct = item.rank === 1 ? 0 : (item.unitPrice / best - 1) * 100;
  });
  return items;
}

function significantDecimals(value: number): number {
  const decimals = 1 - Math.floor(Math.log10(value)); // two significant digits
  return Math.min(8, Math.max(2, decimals));
}

/** One shared decimal count for the unit-price column: at least 2, enough for 2 significant digits,
 *  and increased (up to 8) until genuinely different values no longer look identical. */
export function chooseDecimals(values: number[]): number {
  if (values.length === 0) return 2;
  let decimals = Math.max(...values.map(significantDecimals));
  const collides = (d: number) => {
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (!nearlyEqual(values[i], values[j]) && values[i].toFixed(d) === values[j].toFixed(d)) {
          return true;
        }
      }
    }
    return false;
  };
  while (decimals < 8 && collides(decimals)) decimals++;
  return decimals;
}

export function formatUnitPrice(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '0.00';
  if (value >= 1e21) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      useGrouping: false,
    });
  }
  return value.toFixed(decimals);
}

/** 0 -> "0%", 6.67 -> "+6.7%", 33.3 -> "+33%" (1 decimal below 10%, whole numbers from 10%). */
export function formatPercent(pct: number): string {
  if (pct <= 0) return '0%';
  if (pct < 0.05) return '+<0.1%';
  if (pct < 10) return `+${parseFloat(pct.toFixed(1))}%`;
  return `+${Math.round(pct)}%`;
}
