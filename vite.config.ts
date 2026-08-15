import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/albion52/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Albion52 — rentabilité du craft',
        short_name: 'Albion52',
        description: 'Calcule la rentabilité de ton craft Albion Online en un coup d\'œil.',
        theme_color: '#1c1305',
        background_color: '#100b04',
        display: 'standalone',
        start_url: '/albion52/',
        icons: [
          { src: '/albion52/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/albion52/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/albion52/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/albion52/index.html',
        globPatterns: ['**/*.{js,css,html,png}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/europe\.albion-online-data\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aodp-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 15 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
} satisfies import('vitest/config').UserConfig);
