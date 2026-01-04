
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': (process as any).env
  },
  server: {
    port: 3080,
    host: '0.0.0.0', // Explicitly bind to all interfaces
    strictPort: true
  },
  preview: {
    port: 3080,
    host: '0.0.0.0',
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
