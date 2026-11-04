import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['icons/apple-touch-icon.png'], manifest: { name: 'Shopping List', short_name: 'Shopping', description: 'La tua lista della spesa', theme_color: '#f6f7f4', background_color: '#f6f7f4', display: 'standalone', start_url: '/', icons: [{ src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }, workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] } })],
})
