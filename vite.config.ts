import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// O app é servido em https://<usuario>.github.io/open-bible/
const base = '/open-bible/';

const build = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.GITHUB_SHA?.slice(0, 7) ?? 'dev';

// Publica a versão e o commit do build, para o app saber o que há de novo sem baixar o service worker.
const versionFile: Plugin = {
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: pkg.version, build }) });
  },
};

// Preenche a versão na splash, que vive no index.html e aparece antes do JavaScript.
const htmlVersion: Plugin = {
  name: 'html-version',
  transformIndexHtml: (html) => html.replace('%APP_VERSION%', pkg.version),
};

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
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __APP_BUILD__: JSON.stringify(build) },
  plugins: [
    react(),
    spaFallback,
    versionFile,
    htmlVersion,
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-64.png'],
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
        // As referências cruzadas são baixadas por livro, na primeira vez, e depois funcionam offline.
        runtimeCaching: [
          // Esta função é copiada para dentro do service worker, onde `base` não existe: o caminho vai por extenso.
          { urlPattern: ({ url }) => url.pathname.startsWith('/open-bible/xrefs/'), handler: 'StaleWhileRevalidate', options: { cacheName: 'xrefs' } },
        ],
      },
    }),
  ],
});
