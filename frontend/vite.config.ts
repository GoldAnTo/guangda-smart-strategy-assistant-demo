import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'pursuant-happy-static-characteristics.trycloudflare.com',
      '.trycloudflare.com'
    ]
  },
  proxy: {
    '^/': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
})
