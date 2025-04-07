import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "pry0rity",
    project: "javascript-react"
  }), {
    name: 'configure-api',
  }, sentryVitePlugin({
    org: "pry0rity",
    project: "javascript-react"
  })],

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide': ['lucide-react']
        }
      }
    }
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})