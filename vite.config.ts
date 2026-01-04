
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': (process as any).env
  },
  server: {
    port: 3085,
    host: '0.0.0.0', // Listen on all network interfaces
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3085,
    host: '0.0.0.0', // Ensure preview mode also binds to 0.0.0.0
    strictPort: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
