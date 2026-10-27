import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
// `--mode standalone` builds one self-contained dist-standalone/index.html
// that runs the solver in the page.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'standalone' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'standalone' ? { outDir: 'dist-standalone' } : {},
  server: {
    watch: {
      // The API's build output is locked while it runs.
      ignored: ['**/api/**'],
    },
  },
}))
