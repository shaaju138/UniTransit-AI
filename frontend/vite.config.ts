import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Detect platform: Vercel automatically sets VERCEL=1 during all deployment builds.
const isVercel = Boolean(process.env.VERCEL) || process.env.BUILD_TARGET === 'vercel';

// https://vite.dev/config/
export default defineConfig({
  base: isVercel ? '/' : '/UniTransit-AI/',
  build: {
    outDir: isVercel ? 'dist' : '../docs',
    emptyOutDir: isVercel,
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
