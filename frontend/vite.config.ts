import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/generate-story':    'http://localhost:8001',
      '/generate-tour':     'http://localhost:8001',
      '/generate_image':    'http://localhost:8001',
      '/city_data':         'http://localhost:8001',
      '/city_data_spatial': 'http://localhost:8001',
      '/static':            'http://localhost:8001',
    }
  }
})


