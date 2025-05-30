import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/rep-timer/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    manifest: {
      name: 'Reptimer',
      short_name: 'Reptimer',
      description: 'A simple interval-based repetition timer',
      theme_color: '#1976d2',
      background_color: '#fff',
      display: 'standalone',
      start_url: '.',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
  })],
})
