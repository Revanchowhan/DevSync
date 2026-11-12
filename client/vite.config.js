import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Vercel serves from the domain root. GitHub Pages uses the repository path.
  base: process.env.VERCEL
    ? '/'
    : process.env.GITHUB_ACTIONS === 'true'
      ? '/DevSync/'
      : '/',
  plugins: [react()],
})
