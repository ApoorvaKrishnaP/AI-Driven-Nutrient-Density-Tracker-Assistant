import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/predict': 'http://127.0.0.1:8000',
      '/img_to_text': 'http://127.0.0.1:8000',
      '/recommend': 'http://127.0.0.1:8000',
      '/shops': 'http://127.0.0.1:8000',
      '/login': 'http://127.0.0.1:8000',
      '/register': 'http://127.0.0.1:8000',
      '/meals': 'http://127.0.0.1:8000',
      '/preferences_api': 'http://127.0.0.1:8000'
    }
  }
})
