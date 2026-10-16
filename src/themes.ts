export type ThemeId =
  | 'paper' | 'mint' | 'sunrise' | 'sky' | 'lavender'
  | 'midnight' | 'graphite' | 'forest' | 'plum' | 'ember';

export interface ThemeVars {
  bg: string;       // page background
  surface: string;  // inputs, buttons, menu items
  text: string;
  muted: string;
  line: string;     // borders
  soft: string;     // table rows / tints
  clear: string;    // Clear button background
  onClear: string;
  del: string;      // red X background
  onDel: string;
  best: string;     // Rank 1 highlight (solid)
  onBest: string;
  bestSoft: string; // Rank 1 input tint
}

export interface Theme {
  id: ThemeId;
  dark: boolean;
  name: { en: string; th: string };
  vars: ThemeVars;
}

const LIGHT_DEL = { del: '#d63e4c', onDel: '#ffffff' };
const DARK_DEL = { del: '#d9525e', onDel: '#ffffff' };

export const themes: Theme[] = [
  {
    id: 'paper', dark: false, name: { en: 'Paper', th: 'กระดาษ' },
    vars: { bg: '#ffffff', surface: '#ffffff', text: '#111111', muted: '#595959', line: '#111111', soft: '#f1f1f1',
      clear: '#f2838c', onClear: '#111111', ...LIGHT_DEL, best: '#0e8a45', onBest: '#ffffff', bestSoft: '#d8f5e4' },
  },
  {
    id: 'mint', dark: false, name: { en: 'Mint', th: 'มิ้นต์' },
    vars: { bg: '#e9f6ef', surface: '#f8fdfa', text: '#0f2a1d', muted: '#476654', line: '#14452e', soft: '#d6eee1',
      clear: '#f4a3a3', onClear: '#3a1010', ...LIGHT_DEL, best: '#c2410c', onBest: '#ffffff', bestSoft: '#ffd9c2' },
  },
  {
    id: 'sunrise', dark: false, name: { en: 'Sunrise', th: 'อรุณรุ่ง' },
    vars: { bg: '#fff3e6', surface: '#fffaf4', text: '#3b1f0a', muted: '#755238', line: '#5a2d0c', soft: '#ffe3c7',
      clear: '#f59e9e', onClear: '#3b1f0a', ...LIGHT_DEL, best: '#1d4ed8', onBest: '#ffffff', bestSoft: '#cfe0ff' },
  },
  {
    id: 'sky', dark: false, name: { en: 'Sky', th: 'ฟ้าใส' },
    vars: { bg: '#e8f3ff', surface: '#f7fbff', text: '#0c2340', muted: '#44607c', line: '#12355b', soft: '#d3e7fb',
      clear: '#f6a5ad', onClear: '#2a0f14', ...LIGHT_DEL, best: '#c2410c', onBest: '#ffffff', bestSoft: '#ffdcc8' },
  },
  {
    id: 'lavender', dark: false, name: { en: 'Lavender', th: 'ลาเวนเดอร์' },
    vars: { bg: '#f3edfb', surface: '#fbf8ff', text: '#24153f', muted: '#5b4a7c', line: '#2e1f52', soft: '#e4d8f6',
      clear: '#f4a0b8', onClear: '#2d0f1c', ...LIGHT_DEL, best: '#15803d', onBest: '#ffffff', bestSoft: '#cdf2d9' },
  },
  {
    id: 'midnight', dark: true, name: { en: 'Midnight', th: 'เที่ยงคืน' },
    vars: { bg: '#0e1422', surface: '#172034', text: '#e8edf7', muted: '#98a6c3', line: '#8fa3cc', soft: '#1f2b45',
      clear: '#e07a86', onClear: '#1a0a0d', ...DARK_DEL, best: '#3ddc97', onBest: '#06251a', bestSoft: '#12402f' },
  },
  {
    id: 'graphite', dark: true, name: { en: 'Graphite', th: 'กราไฟต์' },
    vars: { bg: '#151617', surface: '#1f2022', text: '#efefef', muted: '#a0a0a0', line: '#b5b5b5', soft: '#2a2b2d',
      clear: '#e8858d', onClear: '#1a0c0e', ...DARK_DEL, best: '#ffd23f', onBest: '#2a2100', bestSoft: '#453a10' },
  },
  {
    id: 'forest', dark: true, name: { en: 'Forest', th: 'ป่าเขียว' },
    vars: { bg: '#0d1a14', surface: '#15271e', text: '#e4f2e9', muted: '#90b19e', line: '#7fb394', soft: '#1c3327',
      clear: '#e58a8a', onClear: '#1d0b0b', ...DARK_DEL, best: '#ff9f43', onBest: '#2b1a00', bestSoft: '#4a3512' },
  },
  {
    id: 'plum', dark: true, name: { en: 'Plum', th: 'ลูกพลัม' },
    vars: { bg: '#1a1122', surface: '#261933', text: '#f3e8fb', muted: '#b79fcf', line: '#b58be0', soft: '#31204a',
      clear: '#ef8fb0', onClear: '#260a17', ...DARK_DEL, best: '#5eead4', onBest: '#052a25', bestSoft: '#124a45' },
  },
  {
    id: 'ember', dark: true, name: { en: 'Ember', th: 'ถ่านไฟ' },
    vars: { bg: '#1c1310', surface: '#291b16', text: '#f7e9e1', muted: '#c0a495', line: '#d98b5f', soft: '#36241c',
      clear: '#e8808a', onClear: '#220a0d', ...DARK_DEL, best: '#7dd3fc', onBest: '#06222f', bestSoft: '#123a50' },
  },
];

export const DEFAULT_THEME: ThemeId = 'paper';

export function themeById(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function isThemeId(id: unknown): id is ThemeId {
  return typeof id === 'string' && themes.some((t) => t.id === id);
}

export function applyTheme(id: ThemeId): void {
  const theme = themeById(id);
  const root = document.documentElement;
  (Object.keys(theme.vars) as (keyof ThemeVars)[]).forEach((key) => {
    root.style.setProperty(`--${key}`, theme.vars[key]);
  });
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.vars.bg);
}
