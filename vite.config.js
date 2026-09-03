import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project repos at username.github.io/repo-name/
  // Replace 'kpop-song-list' below with your actual repo name.
  base: '/kpop-song-list/',
})
