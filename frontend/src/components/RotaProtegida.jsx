import { Navigate } from 'react-router-dom';

// RotaProtegida faz o controlo inicial da interface do operador.
// O token deste protótipo não é uma credencial criptográfica: não deve ser usado
// como única barreira de uma implantação operacional, que exige sessão assinada no servidor.
export default function RotaProtegida({ children }) {
  let sessao = null;
  try {
    const valorGuardado = window.localStorage.getItem('operador_sessao');
    sessao = valorGuardado ? JSON.parse(valorGuardado) : null;
  } catch {
    // JSON corrompido não deve desbloquear a rota privada.
    window.localStorage.removeItem('operador_sessao');
  }

  // Sem identidade e token de sessão, substitui a navegação pelo ecrã de login.
  if (!sessao?.id || sessao.token !== 'autorizado') {
    return <Navigate to="/operador/login" replace />;
  }
  return children;
}