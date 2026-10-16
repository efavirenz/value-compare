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

- Bump `version` in `package.json`. The top-right badge shows major.minor only (`1.1.0` is shown as `v1.1`), so raise the minor number for releases users should see.
- After deploying, tapping the version badge in the installed app checks for a new service worker
  and reloads into the latest version. If none exists it shows "You are on the latest version".

## Install on iPhone

Open the site in Safari → Share → **Add to Home Screen**.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/logic.ts` | Number sanitising, unit price, competition ranking, formatting |
| `src/App.tsx` | Main screen: rows, Add/Clear/Delete/Undo, Result table, update check |
| `src/Menu.tsx` | Hamburger drawer: language (EN/TH) and 10 themes (5 light, 5 dark) |
| `src/themes.ts`, `src/i18n.ts`, `src/storage.ts` | Theme palettes, texts, Local Storage |
| `scripts/generate-icons.py` | Regenerates the icons in `public/` (needs Pillow) |
