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
  MapPin,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import { api } from "../api";
import { RISK, meta } from "../constants/risk";
import { dateLabel } from "../utils/dateLabel";
import Brand from "./Brand";
import ContextoHistoricoCritico from "./ContextoHistoricoCritico";
import { RiskMap } from "./RiskMap";
import ThemeToggle from "./ThemeToggle";

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
    [aiError, setAiError] = useState("");
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
  useEffect(() => {
    refresh();
  }, [refresh]);
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
  const stats = [
    ["Pessoas registadas", panel.utilizadores_total, Users],
    ["Alertas ativos", panel.alertas_ativos, Bell],
    ["Confirmações recebidas", panel.confirmacoes_recebidas, CheckCircle2],
  ];
  return (
    <main className={`operator operator-${theme}`}>
      <aside className="sidebar">
        <Brand />
        <small>CENTRO DE OPERAÇÕES</small>
        <div className="nav-active">
          <Activity /> Visão geral <i />
        </div>
        <div className="operator-user">
          <b>C</b>
          <span>
            Operador CENOE<small>Centro de emergência</small>
          </span>
        </div>
      </aside>
      <section className="op-main">
        <header className="op-top">
          <span>
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
            <button className="quiet" onClick={refresh}>
              <Activity /> Atualizar
            </button>
          </div>
          <div className="stats">
            {stats.map(([label, value, Icon]) => (
              <article key={label}>
                <Icon />
                <small>{label}</small>
                <b>{value ?? "—"}</b>
                <span>rede comunitária · últimas 24h</span>
              </article>
            ))}
          </div>
          <div className="workspace">
            <section className="card map-panel">
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
                  Esta previsão usa valores de exemplo, não medições do
                  Supabase. É apenas uma sugestão e não emite alertas.
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
                      Sugestão XGBoost: risco {meta(aiPrediction.nivel).name}
                    </b>
                    <span>
                      Probabilidade de inundação: {aiPrediction.risk_percentage}
                    </span>
                    <small>{aiPrediction.message}</small>
                  </div>
                )}
                {aiError && <p className="message error">{aiError}</p>}
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
              <span>{panel.reportes_recentes?.length || 0} reportes</span>
            </header>
            {!panel.reportes_recentes?.length ? (
              <p className="muted">Ainda não há reportes registados.</p>
            ) : (
              panel.reportes_recentes.map((r) => (
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
        </div>
      </section>
    </main>
  );
}
