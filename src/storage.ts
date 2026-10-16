import { MAX_ITEMS, MIN_ITEMS, sanitizeNumber, type RowData, type Unit } from './logic';
import type { Lang } from './i18n';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes';

const KEY = 'value-compare:state:v1';

export interface PersistedState {
  rows: RowData[];
  unit: Unit;
  lang: Lang;
  theme: ThemeId;
}

export function defaultState(): PersistedState {
  return {
    rows: Array.from({ length: MIN_ITEMS }, () => ({ price: '', qty: '' })),
    unit: 'g',
    lang: 'en',
    theme: DEFAULT_THEME,
  };
}

export function loadState(): PersistedState {
  const fallback = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<PersistedState>;

    let rows = fallback.rows;
    if (Array.isArray(data.rows)) {
      rows = data.rows.slice(0, MAX_ITEMS).map((r) => ({
        price: sanitizeNumber(String(r?.price ?? '')),
        qty: sanitizeNumber(String(r?.qty ?? '')),
      }));
      while (rows.length < MIN_ITEMS) rows.push({ price: '', qty: '' });
    }

    return {
      rows,
      unit: data.unit === 'ml' ? 'ml' : 'g',
      lang: data.lang === 'th' ? 'th' : 'en',
      theme: isThemeId(data.theme) ? data.theme : DEFAULT_THEME,
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode / quota). The app keeps working in memory.
  }
}
