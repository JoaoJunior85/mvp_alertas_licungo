import { useEffect, useState } from 'react';
import { Clock3, Database, History, LayoutDashboard, LogOut, Radio, Settings, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from './Brand';

const ITEMS = [
  { label: 'Monitorização', icon: LayoutDashboard, active: true },
  { label: 'Histórico de alertas', icon: History },
  { label: 'Gestão de utilizadores', icon: Users },
  { label: 'Fontes de dados', icon: Database },
  { label: 'Configurações', icon: Settings },
];

function ClockWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat('pt-MZ', {
    timeZone: 'Africa/Maputo', day: '2-digit', month: 'short', year: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat('pt-MZ', {
    timeZone: 'Africa/Maputo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(now);

  return <div className="sidebar-clock" aria-label={`Hora local ${date}, ${time}`}>
    <span><Clock3 size={14} strokeWidth={2} /> HORA LOCAL · MAPUTO</span>
    <b className="font-mono">{time}</b>
    <small>{date}</small>
  </div>;
}

function StatusRow({ tone, label, value }) {
  return <div className="system-status-row">
    <i className={`status-dot ${tone}`} />
    <span>{label}</span>
    <small>{value}</small>
  </div>;
}

// Sidebar da sala de operações: navegação, relógio e estado vindo da API.
export default function OperatorSidebar({ activeAlerts = 0, systemStatus = {}, smsSimulated = true, isOpen = false, onClose = () => {} }) {
  return <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
    <div className="sidebar-brand-row">
      <Brand />
      <button className="sidebar-close" type="button" aria-label="Fechar menu" onClick={onClose}><X size={19} /></button>
    </div>
    <ClockWidget />

    <small className="sidebar-section-label">CENTRO DE OPERAÇÕES</small>
    <nav className="sidebar-nav" aria-label="Navegação do centro de operações">
      {ITEMS.map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          className={`sidebar-nav-item${active ? ' is-active' : ''}`}
          aria-current={active ? 'page' : undefined}
          aria-disabled={!active}
          disabled={!active}
          title={active ? label : 'Secção preparada para uma próxima fase'}
          onClick={active ? () => { window.scrollTo({ top: 0, behavior: 'smooth' }); onClose(); } : undefined}
        >
          <Icon size={19} strokeWidth={2} />
          <span>{label}</span>
          {label === 'Histórico de alertas' && activeAlerts > 0 &&
            <b className="nav-count" aria-label={`${activeAlerts} alertas ativos`}>{activeAlerts}</b>}
          {!active && <small>breve</small>}
          {active && <i className="nav-active-dot" />}
        </button>
      ))}
    </nav>

    <section className="sidebar-system" aria-label="Estado do sistema">
      <h2><Radio size={14} strokeWidth={2} /> ESTADO DO SISTEMA</h2>
      <StatusRow tone={systemStatus.api ? 'online pulse' : 'offline'} label="API" value={systemStatus.api ? 'Online' : 'Offline'} />
      <StatusRow tone={systemStatus.database ? 'online' : 'offline'} label="Base de dados" value={systemStatus.database ? 'Ligada' : 'Sem ligação'} />
      <StatusRow tone={smsSimulated ? 'warning' : 'online'} label="Serviço SMS" value={smsSimulated ? 'Simulação' : 'Configurado'} />
    </section>

    <div className="sidebar-profile">
      <div className="operator-user">
        <b>TC</b>
        <span>Técnico de serviço<small>Sala de Situações · Mocuba</small></span>
      </div>
      <Link to="/" className="sidebar-logout" title="Voltar à página inicial" aria-label="Sair do painel e voltar à página inicial">
        <LogOut size={17} strokeWidth={2} />
      </Link>
    </div>
  </aside>;
}
