import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

// GitHub Pages serves a project site from /<repo-name>/.
// Override with VITE_BASE if the repository has a different name (e.g. VITE_BASE=/my-repo/).
const base = process.env.VITE_BASE ?? '/value-compare/';

export default defineConfig({
  base,
  define: {
    // Shown in the badge as major.minor only (1.1.0 -> "1.1").
    __APP_VERSION__: JSON.stringify(pkg.version.split('.').slice(0, 2).join('.')),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new service worker waits until the user taps the version badge.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Value Compare',
        short_name: 'Value Compare',
        description: 'Compare unit prices to find which product is the better value.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
