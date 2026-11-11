import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In local (non-Docker) development, Vite serves the UI on :5173 and proxies
// WebSocket traffic to the Express server, so the browser always talks to
// a single origin — exactly like production.
const apiTarget = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: { allow: ['..'] }, // allow importing ../shared
    proxy: {
      '/ws': { target: apiTarget, ws: true },
      '/health': apiTarget,
    },
  },
});
