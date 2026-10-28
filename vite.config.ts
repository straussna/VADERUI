import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/** Names the built page dist/VADER.html. */
function exportName(): Plugin {
  return {
    name: 'vader-export-name',
    enforce: 'post',
    generateBundle(_, bundle) {
      const page = bundle['index.html']
      if (page) page.fileName = 'VADER.html'
    },
  }
}

// https://vitejs.dev/config/
// `--mode standalone` (npm run build) writes one self-contained dist/VADER.html
// that runs the solver in the page; the dev server calls the API.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'standalone' ? [react(), viteSingleFile(), exportName()] : [react()],
  server: {
    watch: {
      // The API's build output is locked while it runs.
      ignored: ['**/api/**'],
    },
  },
}))
