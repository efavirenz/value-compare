import { describe, expect, it } from 'vitest';
import { themes, type Theme } from './themes';

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function sRGBtoLin(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function contrast(h1: string, h2: string): number {
  const l1 = luminance(h1);
  const l2 = luminance(h2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(c1: string, p1: number, c2: string): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const p = p1 / 100;
  const r = Math.round(r1 * p + r2 * (1 - p));
  const g = Math.round(g1 * p + g2 * (1 - p));
  const b = Math.round(b1 * p + b2 * (1 - p));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

describe('Theme Contrast (WCAG 2.2 AA)', () => {
  it('has 10 themes, 5 light and 5 dark', () => {
    expect(themes).toHaveLength(10);
    expect(themes.filter((t) => !t.dark)).toHaveLength(5);
    expect(themes.filter((t) => t.dark)).toHaveLength(5);
  });

  themes.forEach((theme: Theme) => {
    describe(`Theme: ${theme.id}`, () => {
      it('satisfies text contrast on background (>= 4.5:1)', () => {
        expect(contrast(theme.vars.text, theme.vars.bg)).toBeGreaterThanOrEqual(4.5);
      });

      it('satisfies text contrast on surface (>= 4.5:1)', () => {
        expect(contrast(theme.vars.text, theme.vars.surface)).toBeGreaterThanOrEqual(4.5);
      });

      it('satisfies onBest contrast on best (>= 4.5:1)', () => {
        expect(contrast(theme.vars.onBest, theme.vars.best)).toBeGreaterThanOrEqual(4.5);
      });

      it('satisfies onDel contrast on del graphic (>= 3.0:1)', () => {
        expect(contrast(theme.vars.onDel, theme.vars.del)).toBeGreaterThanOrEqual(3.0);
      });

      it('satisfies pill.clear text contrast under color-mix (>= 4.5:1)', () => {
        const clearBg = mix(theme.vars.clear, 55, theme.vars.surface);
        expect(contrast(theme.vars.text, clearBg)).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
