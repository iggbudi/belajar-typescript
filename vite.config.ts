import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Aplikasi Kegiatan PKK',
        short_name: 'PKK App',
        description: 'Aplikasi untuk mengelola kegiatan PKK',
        theme_color: '#3178c6',
        background_color: '#f5f5f5',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/favicon\.svg$/,
            handler: 'CacheFirst',
            options: { cacheName: 'icons', expiration: { maxEntries: 10 } },
          },
        ],
      },
    }),
  ],
});
