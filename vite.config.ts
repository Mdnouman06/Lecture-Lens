import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Parse any optional external tunnel hosts while preserving Phase 13 Cloudflare Quick Tunnel host
const defaultAllowedHosts = ['registrar-artistic-another-transform.trycloudflare.com']
const envAllowedHosts = process.env.VITE_ALLOWED_HOSTS
  ? process.env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
  : []
const allowedHosts = Array.from(new Set([...defaultAllowedHosts, ...envAllowedHosts]))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase'
          }
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/canvas-confetti/')) {
            return 'vendor-ui'
          }
        },
      },
    },
  },
})
