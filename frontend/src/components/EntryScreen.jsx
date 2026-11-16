import { Link } from "react-router-dom";
import { ArrowRight, Monitor, Smartphone, Waves } from "lucide-react";
import Brand from "./Brand";

// Tela inicial para escolher o ambiente de operador ou de comunidade.
export function Entry() {
  return (
    <main className="entry">
      <header className="entry-top">
        <Brand variant="entry" />
        <span className="entry-region">ZAMBÉZIA · MOÇAMBIQUE</span>
      </header>
      <section className="entry-center">
        <div className="entry-copy">
          <label>RESPOSTA RÁPIDA, COMUNIDADES SEGURAS</label>
          <h1>
            Preparar hoje.
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
            <span>INGD · INAM · ARA-Centro</span>
          </div>
        </div>
        <div className="entry-options">
          <Link to="/operador">
            <Monitor />
            <small>ACESSO INSTITUCIONAL</small>
            <b>Centro de Operações</b>
            <p>Monitorize condições, valide riscos e coordene alertas.</p>
            <strong>
              Abrir painel <ArrowRight />
            </strong>
          </Link>
          <Link to="/comunidade">
            <Smartphone />
            <small>ACESSO COMUNITÁRIO</small>
            <b>Alertas da minha zona</b>
            <p>Receba avisos oficiais e partilhe informação no terreno.</p>
            <strong>
              Aceder à comunidade <ArrowRight />
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
