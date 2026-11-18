import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Liga React e Tailwind ao servidor de desenvolvimento e ao build do Vite.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Usa o mesmo prefixo da produção e encaminha /api para o backend local.
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
});
