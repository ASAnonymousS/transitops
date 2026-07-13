import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': { target: 'http://backend:8000', changeOrigin: true },
      '/trips': { target: 'http://backend:8000', changeOrigin: true },
      '/vehicles': { target: 'http://backend:8000', changeOrigin: true },
      '/drivers': { target: 'http://backend:8000', changeOrigin: true },
      '/maintenance': { target: 'http://backend:8000', changeOrigin: true },
      '/fuel': { target: 'http://backend:8000', changeOrigin: true },
      '/expenses': { target: 'http://backend:8000', changeOrigin: true },
      '/analytics': { target: 'http://backend:8000', changeOrigin: true },
    },
  },
})
