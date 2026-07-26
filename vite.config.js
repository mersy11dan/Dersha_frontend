import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Keeps the browser on a single origin in development, so no CORS
      // preflight and no absolute API URLs baked into the client.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // The live market feed rides the same origin as the REST calls.
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
      },
    },
  },
})
