import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Bell,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  House,
  LockKeyhole,
  MapPin,
  MessageSquareWarning,
  Phone,
  Radio,
  Radar,
  Shield,
  Users,
  X,
} from "lucide-react";
import { api } from "../api";
import { meta } from "../constants/risk";
import { dateLabel } from "../utils/dateLabel";
import Brand from "./Brand";
import CarrosselMemoria from "./CarrosselMemoria";

// Registo e alertas claros, pensados primeiro para telemóvel.
export default function CommunityScreen() {
  const [districts, setDistricts] = useState([]),
    [communities, setCommunities] = useState([]),
    [districtId, setDistrictId] = useState(""),
    [communityId, setCommunityId] = useState(""),
    [phone, setPhone] = useState(""),
    [user, setUser] = useState(null),
    [alerts, setAlerts] = useState([]),
    [risk, setRisk] = useState(null),
    [confirmed, setConfirmed] = useState([]),
    [modal, setModal] = useState(false),
    [type, setType] = useState("Estrada cortada"),
    [description, setDescription] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const district = districts.find((d) => String(d.id) === String(districtId)),
    community = communities.find((c) => String(c.id) === String(communityId));
  const nivelRisco = alerts[0]?.nivel || risk?.nivel || "indisponivel";
  const riscoIndisponivel = nivelRisco === "indisponivel";
  const classeRisco = riscoIndisponivel
    ? "unavailable"
    : ({ baixo: "low", medio: "medium", alto: "high" }[nivelRisco] || "unavailable");
  const currentDate = new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date());
  // Carrega as opções do banco e atualiza a lista de comunidades ao trocar de distrito.
  useEffect(() => {
    api
      .getDistritos()
      .then((x) => {
        setDistricts(x.distritos || []);
        if (x.distritos?.length) setDistrictId(String(x.distritos[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (districtId) {
      setCommunityId("");
      api
        .getComunidades(districtId)
        .then((x) => setCommunities(x.comunidades || []))
        .catch((e) => setError(e.message));
    }
  }, [districtId]);
  // Regista o contacto e carrega o risco e os avisos emitidos para a zona.
  const register = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.registar({
        telefone: phone,
        distrito_id: Number(districtId),
        comunidade_id: Number(communityId),
      });
      setUser(result.utilizador);
      const [a, r] = await Promise.all([
        api.getAlertasAtivos(result.utilizador.distrito_id),
        api.getRisco(result.utilizador.distrito_id),
      ]);
      setAlerts(a.alertas || []);
      setRisk(r.risco_calculado);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  // Confirma a receção de um alerta usando o utilizador registado.
  const confirm = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api.confirmar({ alerta_id: id, utilizador_id: user.id });
      setConfirmed((v) => [...v, id]);
      setNotice(
        "Receção confirmada. Obrigado por manter a comunidade informada.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  // Envia ao operador uma ocorrência ligada ao distrito e ao alerta atual, se existir.
  const report = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.reportar({
        utilizador_id: user.id,
        distrito_id: user.distrito_id,
        alerta_id: alerts[0]?.id || null,
        tipo,
        descricao,
      });
      setModal(false);
      setDescription("");
      setNotice(
        "Reporte enviado ao centro de operações. Obrigado pela colaboração.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="community">
      <header className="community-header sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <Brand />
        <div className="community-header-status">
          <time><CalendarDays /> {currentDate}</time>
          <span className="system-online"><i /> Sistema Online</span>
        </div>
        <small className="community-header-trust">
          <Shield /> Informação protegida
        </small>
      </header>
      <div className="community-main animate-in fade-in slide-in-from-bottom-4 duration-700 animate-fade-in-up">
        <Link to="/" className="back">
          <ArrowLeft /> Página inicial
        </Link>
        {!user ? (
          <>
            <div className="register grid grid-cols-1 md:grid-cols-2">
              <section className="register-intro animate-fade-in-up">
                <small>ALERTA COMUNITÁRIO</small>
                <h1>
                  Informação a tempo.
                  <br />
                  <em>Proteção para todos.</em>
                </h1>
                <p>
                  Registe o seu contacto para receber avisos sobre cheias e
                  ciclones na sua zona.
                </p>
                <div>
                  <span>
                    <Bell /> Avisos oficiais por SMS
                  </span>
                  <span>
                    <MapPin /> Informação da sua comunidade
                  </span>
                  <span>
                    <Users /> Uma rede mais preparada
                  </span>
                </div>
                <CarrosselMemoria />
              </section>
              <section className="form-card shadow-2xl animate-fade-in-up">
                <small>REGISTO GRATUITO</small>
                <h2>Vamos manter contacto.</h2>
                <p>Preencha os dados para receber avisos da proteção civil.</p>
                <form onSubmit={register}>
                  <label>
                    Número de telemóvel
                    <span className="input">
                      <Phone className="form-field-icon" />
                      <input
                        className="min-h-[48px] border-gray-200 bg-gray-50 text-base transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                        type="tel"
                        placeholder="Ex.: 84 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </span>
                    <small>
                      Usaremos este número apenas para alertas de emergência.
                    </small>
                  </label>
                  <label>
                    Distrito
                    <span className="select">
                      <MapPin className="form-field-icon" />
                      <select
                        className="min-h-[48px] border-gray-200 bg-gray-50 text-base transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                        value={districtId}
                        onChange={(e) => setDistrictId(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          Escolha o distrito
                        </option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </span>
                  </label>
                  <label>
                    Comunidade
                    <span className="select">
                      <House className="form-field-icon" />
                      <select
                        className="min-h-[48px] border-gray-200 bg-gray-50 text-base transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                        value={communityId}
                        onChange={(e) => setCommunityId(e.target.value)}
                        required
                        disabled={!communities.length}
                      >
                        <option value="" disabled>
                          {communities.length
                            ? "Escolha a comunidade"
                            : "Sem comunidades disponíveis"}
                        </option>
                        {communities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </span>
                  </label>
                  {error && (
                    <p className="message error">
                      <AlertOctagon />
                      {error}
                    </p>
                  )}
                  <button
                    className="community-button w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-blue-700 text-base transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:w-auto"
                    disabled={busy || !districts.length || !communities.length}
                  >
                    {busy ? "A guardar…" : "Registar para receber alertas"}{" "}
                    <ArrowRight />
                  </button>
                </form>
                <div className="trust-signals">
                  <span><LockKeyhole /> Dados encriptados</span>
                  <span><BadgeCheck /> Ligado ao INGD</span>
                </div>
                <footer className="form-privacy-note">
                  <Shield /> Os seus dados são usados apenas para avisos de proteção civil.
                </footer>
              </section>
            </div>
          </>
        ) : (
          <section className="dashboard">
            <div className="welcome">
              <div>
                <small>ALERTAS DA MINHA ZONA</small>
                <h1 className="text-3xl md:text-4xl font-extrabold">Olá, vizinho.</h1>
                <span className="location-filter" title="Comunidade selecionada">
                  <MapPin /> {community?.nome} · {district?.nome}
                </span>
              </div>
              <span>
                <CheckCircle2 /> Registo ativo
              </span>
            </div>
            <article
              className={`current shadow-sm hover:shadow-md transition-shadow duration-300 ${riscoIndisponivel ? "current-unavailable bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300" : `current-available border-l-8 risk-${classeRisco}`}`}
              style={{ "--risk": meta(alerts[0]?.nivel || risk?.nivel).color }}
            >
              <div>
                <small>
                  {alerts.length ? "AVISO EMITIDO" : "CONDIÇÃO ATUAL"}
                </small>
                {alerts.length > 0 && (
                  <time>{dateLabel(alerts[0].emitido_em)}</time>
                )}
              </div>
              <small>NÍVEL DE RISCO NA SUA ZONA</small>
              {riscoIndisponivel && (
                <span className="risk-empty-icon" aria-label="A aguardar leituras">
                  <Radar className="animate-spin-slow" />
                </span>
              )}
              <h2>Risco {meta(alerts[0]?.nivel || risk?.nivel).name}</h2>
              <p>{alerts[0]?.mensagem || meta(risk?.nivel).advice}</p>
              <footer>
                <span>
                  <MapPin /> {district?.nome} · {community?.nome}
                </span>
                <span>
                  <Radio />{" "}
                  {alerts.length ? "Ação recomendada" : "Monitorização ativa"}
                </span>
              </footer>
            </article>
            <CarrosselMemoria />
            {error && <p className="message error">{error}</p>}
            {notice && (
              <p className="message success">
                <CheckCircle2 />
                {notice}
              </p>
            )}
            <div className="community-actions">
              {alerts.length ? (
                alerts.map((a) => (
                  <article className="alert-row" key={a.id}>
                    <Bell />
                    <div>
                      <b>Alerta oficial {meta(a.nivel).name.toLowerCase()}</b>
                      <small>Confirme que recebeu esta informação.</small>
                    </div>
                    {confirmed.includes(a.id) ? (
                      <strong>
                        <Check /> Recebido
                      </strong>
                    ) : (
                      <button onClick={() => confirm(a.id)} disabled={busy}>
                        Recebi o alerta <Check />
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <article className="no-alert">
                  <Shield />
                  <div>
                    <b>Sem alerta ativo neste momento</b>
                    <small>
                      Continuaremos a acompanhar as condições na sua zona.
                    </small>
                  </div>
                  <i />
                </article>
              )}
              <button className="report-button" onClick={() => setModal(true)}>
                <MessageSquareWarning /> Reportar situação <ArrowRight />
              </button>
            </div>
            <aside className="guidance">
              <Shield />
              <div>
                <b>Em caso de emergência</b>
                <p>
                  Siga as orientações do INGD. Não atravesse rios ou estradas
                  inundadas.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
      <footer className="community-footer">
        INGD · INAM · ARA-Centro{" "}
        <span>Comunicação de emergência para a Bacia do Licungo</span>
      </footer>
      {modal && (
        <div
          className="backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <header>
              <div>
                <small>INFORMAÇÃO DO TERRENO</small>
                <h2>Reportar situação</h2>
              </div>
              <button onClick={() => setModal(false)} aria-label="Fechar">
                <X />
              </button>
            </header>
            <p>
              O seu reporte ajuda as equipas a compreender o que acontece na sua
              zona.
            </p>
            <form onSubmit={report}>
              <label>
                Tipo de situação
                <span className="select">
                  <MessageSquareWarning />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option>Estrada cortada</option>
                    <option>Alagamento</option>
                    <option>Subida do rio</option>
                    <option>Deslizamento de terra</option>
                    <option>Outro</option>
                  </select>
                  <ChevronDown />
                </span>
              </label>
              <label>
                Descrição
                <textarea
                  rows="4"
                  placeholder="Indique o local e o que observou…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>
              {error && <p className="message error">{error}</p>}
              <button className="community-button" disabled={busy}>
                {busy ? "A enviar…" : "Enviar reporte"} <ArrowRight />
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
