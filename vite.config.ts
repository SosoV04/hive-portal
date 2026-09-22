import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Deployed to https://<user>.github.io/hive-portal/ — rename here if the repo is renamed.
  base: '/hive-portal/',
  plugins: [react()],
  server: {
    // Bind the dual-stack loopback rather than Vite's default `localhost`.
    // Node 17+ resolves `localhost` to ::1 first, so the default binds IPv6
    // ONLY — and a browser that resolves localhost to 127.0.0.1 then gets
    // connection-refused on a server that curl reports as perfectly healthy.
    host: '::',
  },
})
