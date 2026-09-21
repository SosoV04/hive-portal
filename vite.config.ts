import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Deployed to https://<user>.github.io/hive-portal/ — rename here if the repo is renamed.
  base: '/hive-portal/',
  plugins: [react()],
})
