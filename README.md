# Value Compare

Mobile-first Progressive Web App for comparing the unit price of 2–10 products (e.g. while shopping at a supermarket).
React + TypeScript + Vite + `vite-plugin-pwa`. Works offline after the first load.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173/value-compare/
npm test           # unit + UI tests
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (service worker active)
```

## Deploy to GitHub Pages

1. Create a GitHub repository named `value-compare` and push this project to the `main` branch.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml` (install, test, build, deploy).
   The app is served at `https://<your-username>.github.io/value-compare/`.

If the repository has a different name, change the base path in one of two ways:
set `VITE_BASE=/your-repo-name/` for the build, or edit the default in `vite.config.ts`.

## Releasing a new version

- Bump `version` in `package.json`. The top-right badge shows major.minor only (`1.2.0` is shown as `v1.2`), so raise the minor number for releases users should see.
- After deploying, tapping the version badge in the installed app checks for a new service worker
  and reloads into the latest version. If none exists it shows "You are on the latest version".

## Install on iPhone

Open the site in Safari → Share → **Add to Home Screen**.

## Updates

### v1.2.0 (v1.2)

Comprehensive audit validation and remediation release improving calculation correctness, accessibility, theming contrast, resilience, and PWA reliability:

- **Calculation & Input Sanitization**:
  - Smart decimal comma handling (`1,5` → `1.5`) while preserving standard thousands grouping (`1,000` → `1000`).
  - Thai numeral input support (`๐-๙` normalized to `0-9`).
  - Mathematical strict weak ordering comparator in ranking items to prevent non-transitive sort instability.
  - Formatted unit price magnitude guard for numbers $\ge 10^{21}$.
- **Accessibility & Mobile UX**:
  - Fixed row deletion trap when deleting the last row (`N-001`).
  - Corrected menu drawer focus theft; focus remains on the selected theme/language option.
  - Added roving `tabIndex` and keyboard arrow-key navigation for theme options and unit toggle.
  - Added modal keyboard focus trap and Escape key handler for the menu drawer.
  - Persistent screen-reader live region (`role="status" aria-live="polite"`) for reliable toast announcements.
  - Expanded interactive targets (`.del`, `.version`, `.icon-btn`, `.seg`, `.toast button`) to 44 × 44 CSS px.
  - Added horizontal safe area insets (`max(18px, env(safe-area-inset-*))`) for landscape mobile devices.
- **Theming & WCAG 2.2 AA Contrast**:
  - Deepened Paper theme best-deal green (`#0b753a`, 5.46:1 contrast) and Plum theme clear button (`#e880a4`, 4.82:1 contrast under `color-mix`), achieving 100% WCAG 2.2 AA compliance across all 10 themes.
- **Resilience & Storage**:
  - Added React 18 top-level `ErrorBoundary` with localized crash screen and state reset capability.
  - Graceful handling and user-facing warning toast on `QuotaExceededError` during `saveState()`.
  - Multi-tab state synchronization via `storage` event listener.
- **PWA & CI/CD**:
  - Eliminated duplicate asset precaching in `dist/sw.js` (reduced precache from 16 to 10 entries).
  - Added Web App Manifest `id` member.
  - Added `apple-mobile-web-app-status-bar-style: black-translucent` and Content-Security-Policy (CSP) meta tags.
  - Pinned GitHub Actions to immutable 40-character commit SHAs and added automated CI `npm audit --omit=dev` verification.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/logic.ts` | Number sanitising (with smart decimal comma & Thai numerals), unit price, competition ranking, formatting |
| `src/App.tsx` | Main screen: rows, Add/Clear/Delete/Undo, Result table, multi-tab sync, update check |
| `src/Menu.tsx` | Hamburger drawer: language (EN/TH) and 10 WCAG-compliant themes (5 light, 5 dark) with roving focus |
| `src/ErrorBoundary.tsx` | Top-level crash boundary with app reset capability |
| `src/themes.ts`, `src/i18n.ts`, `src/storage.ts` | Theme palettes, texts, Local Storage persistence |
| `src/*.test.ts(x)` | Vitest unit and component tests (logic, UI, contrast matrix, error boundary) |
| `scripts/generate-icons.py` | Regenerates the icons in `public/` (needs Pillow) |
