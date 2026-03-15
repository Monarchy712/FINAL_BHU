import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../globe/frontend',
    emptyOutDir: true,
  },
  base: '/',
  server: {
    proxy: {
      '/generate-story': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/generate-tour': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/generate_image': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/city_data': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/city_data_spatial': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    }
  }
})


