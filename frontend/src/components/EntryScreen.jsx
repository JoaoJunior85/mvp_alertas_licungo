import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole, Monitor, Smartphone, Waves } from "lucide-react";
import Brand from "./Brand";

// Tela inicial para escolher o ambiente de operador ou de comunidade.
export function Entry() {
  return (
    <main className="entry">
      <header className="entry-top">
        <Brand variant="entry" />
        <div className="entry-partners" aria-label="Instituições parceiras">
          <span>EM COORDENAÇÃO COM</span>
          <b>INGD</b><i /> <b>INAM</b><i /> <b>ARA-Centro</b>
        </div>
        <span className="entry-region">ZAMBÉZIA · MOÇAMBIQUE</span>
      </header>
      <section className="entry-center">
        <div className="entry-copy">
          <label>RESPOSTA RÁPIDA, COMUNIDADES SEGURAS</label>
          <h1 className="entry-title">
            <span>Preparar hoje.</span>
            <br />
            <em>Proteger vidas.</em>
          </h1>
          <p>
            Sistema de alerta precoce para cheias e ciclones na Bacia do Rio
            Licungo.
          </p>
          <div className="entry-tags">
            <span>
              <Waves /> Bacia do Licungo
            </span>
            <span>Preparação · Informação · Resposta</span>
          </div>
        </div>
        <div className="entry-options grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link to="/operador/login" className="entry-card entry-card-operator group">
            <div className="entry-card-top">
              <span className="entry-card-icon"><Monitor /></span>
              <small className="access-badge restricted"><LockKeyhole /> Sistema restrito</small>
            </div>
            <small>ACESSO INSTITUCIONAL</small>
            <b>Centro de Operações</b>
            <p>Monitorize condições, valide riscos e coordene alertas.</p>
            <strong>
              Abrir painel <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </strong>
          </Link>
          <Link to="/comunidade" className="entry-card entry-card-community group">
            <div className="entry-card-top">
              <span className="entry-card-icon"><Smartphone /></span>
              <small className="access-badge open">Acesso livre</small>
            </div>
            <small>ACESSO COMUNITÁRIO</small>
            <b>Alertas da minha zona</b>
            <p>Receba avisos oficiais e partilhe informação no terreno.</p>
            <strong>
              Aceder à comunidade <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </strong>
          </Link>
        </div>
      </section>
      <footer className="entry-footer">
        MOÇAMBIQUE · ZAMBÉZIA <span>PROTEÇÃO CIVIL COMUNITÁRIA</span>
      </footer>
    </main>
  );
}
