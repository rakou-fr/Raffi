import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/start':    'http://localhost:3000',
      '/stop':     'http://localhost:3000',
      '/status':   'http://localhost:3000',
      '/articles': 'http://localhost:3000',
      '/qc':       'http://localhost:3000',
      '/done':     'http://localhost:3000',
      '/db':       'http://localhost:3000',
      '/image':    'http://localhost:3000',
    }
  }
})