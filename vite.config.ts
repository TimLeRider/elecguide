import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative : fonctionne sur https://<user>.github.io/<repo>/ sans configuration
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
