import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project repos at username.github.io/repo-name/
  base: '/kpopranker/',
  build: {
    // Keep source maps so a production crash shows the real file/line
    // instead of minified variable names — makes debugging far easier.
    sourcemap: true,
  },
})
