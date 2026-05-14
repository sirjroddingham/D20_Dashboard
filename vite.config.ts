import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    // VITE_BASE_PATH: set to '/D20_Dashboard/' for GitHub Pages, '/' for server
    base: env.VITE_BASE_PATH ?? '/',
  }
})
