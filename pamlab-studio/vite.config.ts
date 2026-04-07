import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/fudo':    { target: 'http://localhost:8443', rewrite: p => p.replace(/^\/api\/fudo/, ''),    changeOrigin: true },
      '/api/matrix42':{ target: 'http://localhost:8444', rewrite: p => p.replace(/^\/api\/matrix42/, ''), changeOrigin: true },
      '/api/ad':      { target: 'http://localhost:8445', rewrite: p => p.replace(/^\/api\/ad/, ''),      changeOrigin: true },
      '/api/azure-ad':{ target: 'http://localhost:8452', rewrite: p => p.replace(/^\/api\/azure-ad/, ''), changeOrigin: true },
      '/api/pipeline':{ target: 'http://localhost:8446', rewrite: p => p.replace(/^\/api\/pipeline/, ''), changeOrigin: true },
      '/api/snow':    { target: 'http://localhost:8447', rewrite: p => p.replace(/^\/api\/snow/, ''),    changeOrigin: true },
      '/api/jsm':     { target: 'http://localhost:8448', rewrite: p => p.replace(/^\/api\/jsm/, ''),     changeOrigin: true },
      '/api/remedy':  { target: 'http://localhost:8449', rewrite: p => p.replace(/^\/api\/remedy/, ''),  changeOrigin: true },
    },
  },
  preview: { port: 3000 },
})
