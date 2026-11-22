import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development, forward API and WebSocket calls to the backend on :3000.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: { allow: ['..'] }, // allow importing ../shared
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': { target: 'http://localhost:3000', ws: true },
    },
  },
});
