import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeft, Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react';
import { api } from '../api';
import Brand from './Brand';

// T06: acesso institucional e criação de contas CENOE, com alvos confortáveis para toque.
export default function T06_LoginOperador() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  // Guarda a resposta do backend para que a rota privada possa abrir o painel.
  const iniciarSessao = (operador, token) => {
    window.localStorage.setItem('operador_sessao', JSON.stringify({ ...operador, token }));
    navigate('/operador', { replace: true });
  };

  // Cria a conta ou valida as credenciais sem expor detalhes internos do servidor.
  const submeter = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErro('');
    try {
      if (mode === 'registo') {
        await api.registarOperador({ nome: nome.trim(), email: email.trim(), senha });
      }
      const result = await api.loginOperador({ email: email.trim(), senha });
      iniciarSessao(result.operador, result.token);
    } catch (error) {
      setErro(mode === 'login' && error.message.includes('Credenciais inválidas')
        ? 'Acesso negado. Credenciais inválidas.'
        : error.message);
    } finally {
      setBusy(false);
    }
  };

  // Preenche os dados públicos de demonstração para acelerar a apresentação.
  const preencherDemo = () => {
    setMode('login');
    setEmail('admin@cenoe.gov.mz');
    setSenha('123456');
    setErro('');
  };

  return (
    <main className="operator-login">
      <header className="operator-login-top">
        <Brand />
        <span>ACESSO INSTITUCIONAL · CENOE</span>
      </header>
      <section className="operator-login-card" aria-labelledby="operator-login-title">
        <Link to="/" className="operator-login-back"><ArrowLeft size={16} /> Página inicial</Link>
        <div className="operator-login-emblem"><KeyRound size={24} /></div>
        <small className="operator-login-eyebrow">SALA DE SITUAÇÕES · ACESSO RESTRITO</small>
        <h1 id="operator-login-title">{mode === 'login' ? 'Acesso do operador' : 'Registar operador'}</h1>
        <p>{mode === 'login' ? 'Entre com as suas credenciais institucionais para monitorizar e coordenar a resposta.' : 'Crie uma conta de operador para aceder ao centro de operações.'}</p>
        <form onSubmit={submeter}>
          {mode === 'registo' && <label>
            Nome completo
            <span className="operator-login-input"><UserRound /><input value={nome} onChange={(event) => setNome(event.target.value)} autoComplete="name" maxLength={100} placeholder="Nome do técnico" required /></span>
          </label>}
          <label>
            Email institucional
            <span className="operator-login-input"><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="nome@cenoe.gov.mz" required /></span>
          </label>
          <label>
            Senha
            <span className="operator-login-input"><KeyRound /><input type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'registo' ? 8 : undefined} placeholder="Introduza a senha" required /><button type="button" className="operator-password-toggle" onClick={() => setMostrarSenha((visible) => !visible)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff /> : <Eye />}</button></span>
          </label>
          {erro && <div className="operator-login-error" role="alert"><AlertOctagon size={17} />{erro}</div>}
          <button className="operator-login-submit" type="submit" disabled={busy}>{busy ? 'A validar…' : mode === 'login' ? 'Entrar no painel' : 'Criar conta de operador'}</button>
        </form>
        {mode === 'login' && <button className="operator-demo-fill" type="button" onClick={preencherDemo}>Preencher credenciais de teste</button>}
        <div className="operator-login-switch">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem uma conta?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'registo' : 'login'); setErro(''); }}>{mode === 'login' ? 'Registar novo operador' : 'Voltar ao login'}</button>
        </div>
        <small className="operator-login-note">Acesso de demonstração para o protótipo Licungo.</small>
      </section>
      <footer className="operator-login-footer">INGD · CENOE · MONITORIZAÇÃO DA BACIA DO LICUNGO</footer>
    </main>
  );
}