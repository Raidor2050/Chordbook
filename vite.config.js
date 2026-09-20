import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' so the built SPA works from any GitHub Pages sub-path
// (https://<user>.github.io/<repo>/), not just a custom domain root.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    host: true,
  },
});