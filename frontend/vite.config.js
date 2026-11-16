import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Liga React e Tailwind ao servidor de desenvolvimento e ao build do Vite.
export default defineConfig({ plugins: [react(), tailwindcss()] });
