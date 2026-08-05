import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 5173 and 5174 belong to the agent panels — the admin console takes 5175
    // so all three can run side by side.
    port: 5175,
    // Fail loudly rather than silently drifting to another port, which would
    // break any CORS allowlist or OAuth redirect URI pinned to this one.
    strictPort: true,
  },
  preview: {
    port: 4175,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
