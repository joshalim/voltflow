
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': (process as any).env
  },
  server: {
    port: 5000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
