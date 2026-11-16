/**
 * Extensão Tailwind 4 usada pelo protótipo Licungo Alerta.
 * Define tokens para reutilizar a paleta em classes utilitárias do projeto.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        risk: { low: '#10B981', medium: '#F59E0B', high: '#EF4444' },
        oceanic: { DEFAULT: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', muted: '#94A3B8', action: '#3B82F6' },
        community: { DEFAULT: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', action: '#2563EB' },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'risk-pulse': { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.62', transform: 'scale(1.12)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'risk-pulse': 'risk-pulse 1.8s ease-in-out infinite', 'fade-up': 'fade-up .28s ease-out both' },
    },
  },
};
