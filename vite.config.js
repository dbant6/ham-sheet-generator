import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set VITE_BASE to "/<repo-name>/" at build time,
// e.g. `VITE_BASE=/ham-sheet-generator/ npm run build`.
// For user/organization pages (user.github.io), leave it as "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
