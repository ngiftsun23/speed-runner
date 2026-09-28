import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  preview: {
    // Quick tunnels get a random subdomain; allow the family so the built app
    // can be opened over HTTPS on a phone without editing this each time.
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Schulte Trainer',
        short_name: 'Schulte',
        description: 'Visual search training on Schulte tables, with Eyes mode and per-table history.',
        lang: 'en',
        theme_color: '#12141a',
        background_color: '#12141a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // woff2 matters: the Inter files must be cached or the installed app
        // falls back to a system font when offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
