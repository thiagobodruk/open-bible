import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// O app é servido em https://<usuario>.github.io/open-bible/
const base = '/open-bible/';

// GitHub Pages devolve 404.html para caminhos desconhecidos. Com o mesmo conteúdo do index, links como /open-bible/pt_nvi/jn/3 abrem o app.
const spaFallback: Plugin = {
  name: 'spa-fallback',
  generateBundle: {
    order: 'post',
    handler(_, bundle) {
      const index = bundle['index.html'];
      if (index?.type === 'asset') this.emitFile({ type: 'asset', fileName: '404.html', source: index.source });
    },
  },
};

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    spaFallback,
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
        globIgnores: ['404.html'],
        cleanupOutdatedCaches: true,
        // Os textos das versões vêm de CDN e ficam no IndexedDB. O service worker guarda só o app.
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
