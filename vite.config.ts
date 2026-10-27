import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // The API's build output is locked while it runs.
      ignored: ['**/api/**'],
    },
  },
})
