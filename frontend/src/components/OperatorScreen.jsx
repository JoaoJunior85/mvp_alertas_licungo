import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  CloudRain,
  Database,
  FlaskConical,
  MapPin,
  Menu,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import { api } from "../api";
import { RISK, meta } from "../constants/risk";
import { dateLabel } from "../utils/dateLabel";
import ContextoHistoricoCritico from "./ContextoHistoricoCritico";
import OperatorSidebar from "./OperatorSidebar";
import { RiskMap } from "./RiskMap";
import ThemeToggle from "./ThemeToggle";
import { DADOS_PAINEL_DEMONSTRACAO } from "../demo/operatorDemoData";

const DADOS_DEMONSTRATIVOS_IA = {
  annual_precipitation: 1200,
  precipitation_of_wettest_month: 300,
  precipitation_seasonality: 50,
  drainage_density: 2.5,
  drainage_texture: 10,
  basin_relief: 500,
  annual_mean_temperature: 20,
  temperature_seasonality: 500,
  curve_number_amcii: 70,
  ruggedness_number: 0.5,
  infiltration_number: 5,
  climate_type: 2,
  landcover_type: 1,
  soil_type: 3,
};

// Painel desktop para analisar indicadores, validar a classificação e emitir alertas.
export default function OperatorScreen() {
  const [districts, setDistricts] = useState([]),
    [selected, setSelected] = useState(null),
    [risks, setRisks] = useState({}),
    [risk, setRisk] = useState(null),
    [manual, setManual] = useState(""),
    [reason, setReason] = useState(""),
    [panel, setPanel] = useState({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [aiBusy, setAiBusy] = useState(false),
    [aiPrediction, setAiPrediction] = useState(null),
    [aiError, setAiError] = useState(""),
    [systemStatus, setSystemStatus] = useState({ api: false, database: false }),
    [demoMode, setDemoMode] = useState(
      () => window.localStorage.getItem("licungo-operator-demo") === "true",
    );
  const refresh = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([api.getDistritos(), api.getPainel()]);
      const items = d.distritos || [];
      setDistricts(items);
      setPanel(p);
      setSelected((s) => s || items[0] || null);
      const results = await Promise.all(
        items.map(async (x) => {
          try {
            return [x.id, (await api.getRisco(x.id)).risco_calculado];
          } catch {
            return [x.id, null];
          }
        }),
      );
      setRisks(Object.fromEntries(results));
    } catch (e) {
      setError(e.message);
    }
  }, []);
  // Recupera a preferência anterior; tema escuro é o padrão da primeira visita.
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("licungo-operator-theme") || "dark",
  );
  // Controla apenas a abertura visual do menu lateral em ecrãs pequenos.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    refresh();
  }, [refresh]);
  // Actualiza o estado dos serviços sem misturar saúde da API com dados do painel.
  useEffect(() => {
    let active = true;
    const checkServices = async () => {
      try {
        const health = await api.getHealth();
        if (active) setSystemStatus({ api: true, database: health.database === "ok", smsSimulated: health.sms_mode !== "real" });
      } catch {
        if (active) setSystemStatus({ api: false, database: false, smsSimulated: true });
      }
    };
    checkServices();
    const timer = window.setInterval(checkServices, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    window.localStorage.setItem("licungo-operator-demo", String(demoMode));
  }, [demoMode]);
  // Guarda cada escolha para manter o mesmo tema quando o operador voltar.
  useEffect(() => {
    window.localStorage.setItem("licungo-operator-theme", theme);
  }, [theme]);
  // Alterna a classe da tela; o CSS aplica as cores correspondentes.
  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  // Carrega a análise atual e redefine ajustes anteriores para cada nova zona.
  const analyze = async (district = selected) => {
    if (!district) return;
    setSelected(district);
    setRisk(null);
    setAiPrediction(null);
    setAiError("");
    setBusy(true);
    setError("");
    setNotice("");
    setManual("");
    setReason("");
    try {
      const data = await api.getRisco(district.id);
      setRisk(data.risco_calculado);
      setRisks((v) => ({ ...v, [district.id]: data.risco_calculado }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const analyzeWithAi = async () => {
    setAiBusy(true);
    setAiError("");
    setAiPrediction(null);
    try {
      const prediction = await api.getAiPrediction(DADOS_DEMONSTRATIVOS_IA);
      const nivel = {
        HIGH: "alto",
        MEDIUM: "medio",
        LOW: "baixo",
      }[String(prediction.risk_level || "").toUpperCase()];
      const score = Number(prediction.flood_risk_score);
      if (!nivel || !Number.isFinite(score) || score < 0 || score > 1) {
        throw new Error("A API XGBoost devolveu uma previsão inválida.");
      }
      setAiPrediction({ ...prediction, nivel });
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiBusy(false);
    }
  };
  // Guarda o alerta validado; um nível diferente do resultado IA requer justificação.
  const issue = async (adjusted) => {
    if (
      !risk ||
      !selected ||
      !risk.dados_disponiveis ||
      risk.nivel === "indisponivel"
    ) {
      setError("Não é possível emitir um alerta sem dados atuais validados.");
      return;
    }
    if (adjusted && !reason.trim()) {
      setError("Justifique o ajuste manual antes de emitir.");
      return;
    }
    const level = adjusted ? manual : risk.nivel;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.enviarAlerta({
        tipo_desastre: "misto",
        nivel: level,
        mensagem: `ALERTA ${meta(level).name.toUpperCase()} — Risco na zona de ${selected.nome}. ${meta(level).advice} INGD`,
        distritos_ids: [Number(selected.id)],
        operador_id: 1,
        score_ia: risk.score,
        justificacao_ajuste: adjusted ? reason.trim() : null,
      });
      setNotice(`Alerta emitido para ${selected.nome}.`);
      setPanel((p) => ({
        ...p,
        alertas_ativos: Number(p.alertas_ativos || 0) + 1,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const painelVisivel = demoMode ? DADOS_PAINEL_DEMONSTRACAO : panel;
  const alertasVisiveis = Number(painelVisivel.alertas_ativos || 0);
  const stats = [
    ["Pessoas registadas", painelVisivel.utilizadores_total, Users],
    ["Alertas ativos", painelVisivel.alertas_ativos, Bell],
    ["Confirmações recebidas", painelVisivel.confirmacoes_recebidas, CheckCircle2],
  ];
  return (
    <main className={`operator operator-${theme}`}>
      {isSidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <OperatorSidebar
        activeAlerts={alertasVisiveis}
        systemStatus={systemStatus}
        smsSimulated={systemStatus.smsSimulated ?? true}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <section className="op-main">
        <header className="op-top">
          <span>
            <button
              className="mobile-menu-button"
              type="button"
              aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              <Menu size={21} />
            </button>
            <Link to="/">LICUNGO</Link>　›　<b>Monitorização</b>
          </span>
          <span className="op-status">
            Bacia do Licungo{" "}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </span>
        </header>
        <div className="op-content">
          <div className="heading">
            <div>
              <small>MONITORIZAÇÃO EM TEMPO REAL</small>
              <h1>Painel de operações</h1>
              <p>Analise as condições e coordene uma resposta rápida.</p>
            </div>
            <div className="heading-actions">
              <button className={`demo-toggle${demoMode ? " selected" : ""}`} onClick={() => setDemoMode((enabled) => !enabled)}>
                {demoMode ? <Database /> : <FlaskConical />}
                {demoMode ? "Desativar demonstração" : "Dados de demonstração"}
              </button>
              <button className="quiet" onClick={refresh}><Activity /> Atualizar</button>
            </div>
          </div>
          {demoMode && <div className="demo-banner"><FlaskConical size={15} /> MODO DE DEMONSTRAÇÃO · Os indicadores e reportes abaixo são exemplos locais e não estão gravados na Supabase.</div>}
          <div className="stats grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {stats.map(([label, value, Icon]) => (
              <article key={label}>
                <Icon />
                <small>{label}</small>
                <b>{value ?? "—"}</b>
                <span>rede comunitária · últimas 24h</span>
              </article>
            ))}
          </div>
          <div className="workspace grid grid-cols-1 lg:grid-cols-3">
            <section className="card map-panel lg:col-span-2">
              <header>
                <div>
                  <small>MAPA DE RISCO</small>
                  <h2>Condições por distrito</h2>
                </div>
                <span className="source">
                  <i /> ARA · INAM
                </span>
              </header>
              <RiskMap
                districts={districts}
                risks={risks}
                selected={selected}
                onSelect={analyze}
              />
              <div className="districts">
                {districts.map((d) => (
                  <button
                    key={d.id}
                    className={selected?.id === d.id ? "chosen" : ""}
                    onClick={() => analyze(d)}
                  >
                    <i style={{ background: meta(risks[d.id]?.nivel).color }} />
                    {d.nome}
                    <ArrowRight />
                  </button>
                ))}
              </div>
            </section>
            <section className="card validation">
              <header>
                <div>
                  <h2>Análise de risco</h2>
                </div>
                <span className="ai-tag">
                  <Activity /> REGRAS PONDERADAS
                </span>
              </header>
              <div className="ai-demo">
                <small>TESTE XGBOOST · VALORES DE DEMONSTRAÇÃO</small>
                <p>
                  Os valores enviados são exemplos, não dados do Supabase. O
                  modelo estima suscetibilidade à inundação; não representa o
                  risco hidrometeorológico atual nem emite alertas.
                </p>
                <button
                  className="primary"
                  disabled={aiBusy}
                  onClick={analyzeWithAi}
                >
                  {aiBusy ? "A analisar risco…" : "Fazer análise de risco"}
                </button>
                {aiPrediction && (
                  <div className="ai-demo-result">
                    <b style={{ color: meta(aiPrediction.nivel).color }}>
                      XGBoost · suscetibilidade {meta(aiPrediction.nivel).name}
                    </b>
                    <span>
                      Score estimado: {aiPrediction.risk_percentage}
                    </span>
                    <small>{aiPrediction.message}</small>
                  </div>
                )}
                <details className="demo-inputs">
                  <summary>Ver dados enviados ao modelo · 14 campos</summary>
                  <div className="demo-input-grid">
                    {Object.entries(DADOS_DEMONSTRATIVOS_IA).map(([key, value]) => <span key={key}><code>{key}</code><b>{value}</b></span>)}
                  </div>
                </details>
                {aiError && <div className="message error ai-unavailable"><AlertOctagon /><div><span>{aiError}</span><small>Para executar a classificação, inicia a API Python em <code>api-risco/api-py</code> e mantém o terminal aberto. A interface envia estes valores ao modelo real; não inventa uma previsão se o serviço estiver desligado.</small></div></div>}
              </div>
              <label className="field-label">
                Distrito em análise
                <select
                  value={selected?.id || ""}
                  onChange={(e) =>
                    analyze(
                      districts.find((d) => String(d.id) === e.target.value),
                    )
                  }
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </label>
              {!risk ? (
                <div className="empty">
                  <Activity />
                  <b>Pronto para analisar</b>
                  <p>Selecione um distrito para classificar o risco atual.</p>
                  <button
                    className="primary"
                    disabled={busy || !selected}
                    onClick={() => analyze()}
                  >
                    {busy ? "A analisar…" : "Analisar risco"} <ArrowRight />
                  </button>
                </div>
              ) : (
                <div className="analysis">
                  <div className="score">
                    <b>{risk.score}</b>
                    <span>/ 100</span>
                  </div>
                  <div>
                    <small>CLASSIFICAÇÃO AUTOMÁTICA</small>
                    <h3 style={{ color: meta(risk.nivel).color }}>
                      {risk.nivel === "alto" && (
                        <AlertOctagon
                          className="risk-high-icon animate-risk-pulse"
                          strokeWidth={2.5}
                        />
                      )}{" "}
                      Risco {meta(risk.nivel).name}
                    </h3>
                    <p>
                      {selected?.nome} ·{" "}
                      {risk.dados_disponiveis
                        ? "dados recentes"
                        : "sem leituras recentes"}
                    </p>
                  </div>
                  <div className="signals">
                    <span>
                      <Waves /> Rio <b>{risk.detalhes?.rio ?? 0}</b>
                    </span>
                    <span>
                      <CloudRain /> Chuva <b>{risk.detalhes?.chuva ?? 0}</b>
                    </span>
                    <span>
                      <Wind /> Ciclone{" "}
                      <b>{risk.detalhes?.ciclone ? "Ativo" : "Sem sinal"}</b>
                    </span>
                  </div>
                  <button
                    className="accept"
                    disabled={busy}
                    onClick={() => issue(false)}
                  >
                    <Check />{" "}
                    {busy ? "A emitir…" : "Aceitar risco e emitir alerta"}
                  </button>
                  <div className="manual">
                    <label>
                      Ajustar classificação manualmente <small>RF10</small>
                    </label>
                    <div>
                      <select
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                      >
                        <option value="">Escolher nível</option>
                        {Object.entries(RISK).map(([k, v]) => (
                          <option key={k} value={k}>
                            Risco {v.name}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!manual || manual === risk.nivel || busy}
                        onClick={() => issue(true)}
                      >
                        Aplicar ajuste
                      </button>
                    </div>
                    {manual && manual !== risk.nivel && (
                      <textarea
                        rows="2"
                        placeholder="Justifique a decisão…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}
              {risk?.nivel === "alto" && <ContextoHistoricoCritico />}
              {error && (
                <p className="message error">
                  <AlertOctagon />
                  {error}
                </p>
              )}
              {notice && (
                <p className="message success">
                  <CheckCircle2 />
                  {notice}
                </p>
              )}
            </section>
          </div>
          <section className="card reports">
            <header>
              <div>
                <small>RETORNO DO TERRENO</small>
                <h2>Reportes recentes</h2>
              </div>
              <span>{painelVisivel.reportes_recentes?.length || 0} reportes{demoMode ? " · demonstração" : ""}</span>
            </header>
            {!painelVisivel.reportes_recentes?.length ? (
              <p className="muted">Ainda não há reportes registados.</p>
            ) : (
              painelVisivel.reportes_recentes.map((r) => (
                <article key={r.id}>
                  <MapPin />
                  <div>
                    <b>{r.tipo}</b>
                    <p>{r.descricao}</p>
                    <small>
                      {r.distrito || "Distrito"} ·{" "}
                      {r.telefone || "Utilizador registado"}
                    </small>
                  </div>
                  <time>{dateLabel(r.criado_em)}</time>
                </article>
              ))
            )}
          </section>
          {demoMode && (
            <section className="card demo-alerts">
              <header>
                <div><small>EXERCÍCIO DE APRESENTAÇÃO</small><h2>Alertas comunitários simulados</h2></div>
                <span>não enviados por SMS</span>
              </header>
              <div className="demo-alert-list">
                {DADOS_PAINEL_DEMONSTRACAO.alertas.map((alerta) => (
                  <article key={alerta.id}>
                    <span className={`demo-risk-badge ${alerta.nivel === "alto" ? "high" : "medium"}`}>{alerta.nivel}</span>
                    <div><b>{alerta.perigo} · {alerta.distrito}</b><small>Zona de demonstração · emitido {alerta.emitido}</small></div>
                    <span className="demo-confirmations"><CheckCircle2 size={14} /> {alerta.confirmacoes}/{alerta.total} confirmações</span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
