import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local only. The Vite 5 dev server has known file-read bugs on Windows, so it is not exposed to the
    // network by default. To test on a phone on the same Wi-Fi, run: npm run dev:client -- --host
    host: '127.0.0.1',
    proxy: {
      '/api': { target: `http://127.0.0.1:${process.env.PORT ?? 8787}`, changeOrigin: true },
    },
  },
})
