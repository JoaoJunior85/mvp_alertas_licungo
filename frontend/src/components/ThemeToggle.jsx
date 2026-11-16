import { Moon, Sun } from 'lucide-react';

// Botão acessível que pede ao painel a troca entre os temas claro e escuro.
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>Tema {isDark ? 'claro' : 'escuro'}</span>
    </button>
  );
}
