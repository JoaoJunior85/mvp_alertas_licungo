import { AlertTriangle } from 'lucide-react';

// Contexto de impacto histórico mostrado quando a classificação atual é alta.
export default function ContextoHistoricoCritico() {
  return (
    <aside className="historical-risk-alert bg-red-950/50 border border-red-800" role="note" aria-label="Contexto histórico de risco alto">
      <img src="/images/historico-ciclone.jpg" alt="Danos em habitações e vegetação após a passagem de um ciclone em Moçambique" />
      <AlertTriangle className="historical-risk-icon" size={25} strokeWidth={2.7} aria-hidden="true" />
      <div className="historical-risk-copy">
        <strong>Contexto de risco alto</strong>
        <p>Eventos históricos de 2019 e 2023 demonstram o potencial de impacto. Ação imediata recomendada para reduzir o risco de perdas humanas.</p>
      </div>
    </aside>
  );
}
