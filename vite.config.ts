import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// O app é servido em https://<usuario>.github.io/open-bible/
const base = '/open-bible/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        id: base,
        name: 'Open Bible',
        short_name: 'Open Bible',
        description: 'A free, minimalist Bible reader. Offline-first, no account.',
        lang: 'en',
        categories: ['books', 'education', 'lifestyle'],
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf9f7',
        theme_color: '#faf9f7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // Os textos das versões vêm de CDN e ficam no IndexedDB. O service worker guarda só o app.
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
