// Importa as dependências HTTP e o cliente PostgreSQL partilhado pela API.
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { calcularClassificacao } = require('./services/risk');
const { enviarSMS } = require('./services/smsService');
const { preverRiscoInundacao } = require('./services/riskModel');

// Configura o parsing de JSON e permite chamadas do frontend.
const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Define os limites de risco e as coordenadas para os três distritos do estudo de caso.
const DISTRITOS_MAPA = {
  Mocuba: { lat: -16.84, lng: 36.98 },
  Namacurra: { lat: -17.61, lng: 37.00 },
  'Maganja da Costa': { lat: -17.43, lng: 37.00 },
};

// Expõe o estado do serviço para uma verificação rápida.
app.get('/', (_req, res) => {
  res.json({ mensagem: 'API do Sistema de Alerta Precoce (Licungo) está online!' });
});

// Verifica a ligação à base de dados para readiness checks do container de produção.
app.get(['/health', '/api/health'], async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok', sms_mode: process.env.SMS_API_KEY ? 'real' : 'simulado' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
});

// Entrega os distritos e as comunidades existentes para os formulários e o mapa.
app.get('/api/distritos', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM distritos ORDER BY nome');
    res.json({ distritos: result.rows.map((item) => ({ ...item, ...(DISTRITOS_MAPA[item.nome] || {}) })) });
  } catch (error) {
    console.error('Erro ao carregar distritos:', error);
    res.status(500).json({ erro: 'Não foi possível carregar os distritos.' });
  }
});

// Filtra comunidades pelo distrito escolhido.
app.get('/api/comunidades', async (req, res) => {
  const { distrito_id } = req.query;
  if (!distrito_id) return res.status(400).json({ erro: 'distrito_id é obrigatório.' });
  try {
    const result = await pool.query('SELECT id, nome, distrito_id FROM comunidades WHERE distrito_id = $1 ORDER BY nome', [distrito_id]);
    res.json({ comunidades: result.rows });
  } catch (error) {
    console.error('Erro ao carregar comunidades:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as comunidades.' });
  }
});

// Calcula o risco com a leitura mais recente do rio e do estado meteorológico do distrito.
app.get('/api/risco/:distritoId', async (req, res) => {
  try {
    const { distritoId } = req.params;
    if (!/^\d+$/.test(distritoId)) return res.status(400).json({ erro: 'distritoId inválido.' });
    const [rio, meteo] = await Promise.all([
      pool.query(`
        SELECT e.nome AS estacao, e.cota_atencao, e.cota_emergencia, lr.nivel_metros, lr.lido_em
        FROM estacoes e
        LEFT JOIN LATERAL (
          SELECT nivel_metros, lido_em FROM leituras_rio
          WHERE estacao_id = e.id ORDER BY lido_em DESC LIMIT 1
        ) lr ON true
        WHERE e.distrito_id = $1 ORDER BY lr.lido_em DESC NULLS LAST LIMIT 1
      `, [distritoId]),
      pool.query(`SELECT chuva_prevista_24h_mm, estado_ciclone, registado_em AS registo_em FROM estado_meteorologico WHERE distrito_id = $1 ORDER BY registado_em DESC LIMIT 1`, [distritoId]),
    ]);
    const station = rio.rows[0];
    const weather = meteo.rows[0];
    const agora = Date.now();
    const idadeRio = station?.lido_em ? agora - new Date(station.lido_em).getTime() : Infinity;
    const idadeMeteo = weather?.registo_em ? agora - new Date(weather.registo_em).getTime() : Infinity;
    const leituraRioValida = station?.nivel_metros != null && station?.cota_atencao != null && station?.cota_emergencia != null
      && Number.isFinite(Number(station.nivel_metros))
      && Number.isFinite(Number(station?.cota_atencao)) && Number.isFinite(Number(station?.cota_emergencia))
      && idadeRio >= 0 && idadeRio <= 6 * 60 * 60 * 1000;
    const meteoValida = weather?.chuva_prevista_24h_mm != null && weather?.estado_ciclone != null
      && Number.isFinite(Number(weather.chuva_prevista_24h_mm)) && Number(weather.chuva_prevista_24h_mm) >= 0
      && idadeMeteo >= 0 && idadeMeteo <= 24 * 60 * 60 * 1000;
    const risco = leituraRioValida && meteoValida
      ? calcularClassificacao({ nivel: station.nivel_metros, atencao: station.cota_atencao,
        emergencia: station.cota_emergencia, chuva: weather.chuva_prevista_24h_mm, ciclone: weather.estado_ciclone })
      : { score: null, nivel: 'indisponivel', detalhes: null };
    res.json({ risco_calculado: { ...risco, distrito_id: Number(distritoId), estacao: station?.estacao || null,
      indicadores: {
        nivel_rio_metros: station?.nivel_metros ?? null,
        cota_atencao_metros: station?.cota_atencao ?? null,
        cota_emergencia_metros: station?.cota_emergencia ?? null,
        chuva_prevista_24h_mm: weather?.chuva_prevista_24h_mm ?? null,
        estado_ciclone: weather?.estado_ciclone ?? null,
      },
      atualizado_em: [station?.lido_em, weather?.registo_em].filter(Boolean).sort().at(-1) || null,
      dados_disponiveis: Boolean(leituraRioValida && meteoValida), fontes: {
        rio: { disponivel: Boolean(leituraRioValida), lido_em: station?.lido_em || null },
        meteorologia: { disponivel: Boolean(meteoValida), registo_em: weather?.registo_em || null },
      },
    } });
  } catch (error) {
    console.error('Erro ao classificar risco:', error);
    res.status(500).json({ erro: 'Não foi possível classificar o risco.' });
  }
});

// Encaminha uma previsão de suscetibilidade ao serviço Python sem a misturar com o risco atual.
// O pedido precisa conter as 13 variáveis geográficas/climáticas do modelo.
app.post('/api/risco/modelo', async (req, res) => {
  try {
    const prediction = await preverRiscoInundacao(req.body);
    res.json({ previsao_modelo: prediction });
  } catch (error) {
    const status = error.statusCode || 503;
    if (status >= 500) console.error('Serviço XGBoost indisponível:', error.message);
    res.status(status).json({ erro: error.message || 'Não foi possível consultar o modelo.' });
  }
});

// Regista o contacto sem depender de uma restrição UNIQUE não especificada no esquema.
app.post('/api/utilizadores', async (req, res) => {
  const { telefone, distrito_id, comunidade_id } = req.body;
  if (typeof telefone !== 'string' || !telefone.trim() || !distrito_id || !comunidade_id) {
    return res.status(400).json({ erro: 'telefone, distrito_id e comunidade_id são obrigatórios.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const community = await client.query('SELECT 1 FROM comunidades WHERE id = $1 AND distrito_id = $2', [comunidade_id, distrito_id]);
    if (!community.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'A comunidade não pertence ao distrito selecionado.' });
    }
    const existing = await client.query('SELECT id FROM utilizadores_comunidade WHERE telefone = $1 ORDER BY id LIMIT 1', [telefone.trim()]);
    const result = existing.rowCount
      ? await client.query('UPDATE utilizadores_comunidade SET distrito_id = $1, comunidade_id = $2 WHERE id = $3 RETURNING id, telefone, distrito_id, comunidade_id', [distrito_id, comunidade_id, existing.rows[0].id])
      : await client.query('INSERT INTO utilizadores_comunidade (telefone, distrito_id, comunidade_id) VALUES ($1, $2, $3) RETURNING id, telefone, distrito_id, comunidade_id', [telefone.trim(), distrito_id, comunidade_id]);
    await client.query('COMMIT');
    res.status(201).json({ utilizador: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registar utilizador:', error);
    res.status(500).json({ erro: 'Não foi possível registar o utilizador.' });
  } finally { client.release(); }
});
// Cria e associa o alerta numa transação antes de iniciar notificações externas.
app.post('/api/alertas', async (req, res) => {
  const { tipo_desastre, nivel, mensagem, distritos_ids, operador_id, score_ia, justificacao_ajuste = null } = req.body;
  if (!tipo_desastre || !nivel || !mensagem || !Array.isArray(distritos_ids) || !distritos_ids.length || !operador_id) {
    return res.status(400).json({ erro: 'tipo_desastre, nivel, mensagem, distritos_ids e operador_id são obrigatórios.' });
  }
  let client;
  let alerta;

  // Guarda primeiro o alerta. Uma falha posterior do fornecedor SMS não apaga o alerta validado.
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const inserted = await client.query(`
      INSERT INTO alertas (tipo_desastre, nivel, mensagem, operador_id, score_ia, justificacao_ajuste)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [tipo_desastre, nivel, mensagem, operador_id, score_ia ?? null, justificacao_ajuste]);
    await client.query(`INSERT INTO alertas_distritos (alerta_id, distrito_id) SELECT $1, unnest($2::int[])`, [inserted.rows[0].id, distritos_ids]);
    await client.query('COMMIT');
    alerta = inserted.rows[0];
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao criar alerta:', error);
    return res.status(500).json({ erro: 'Não foi possível criar o alerta.' });
  } finally {
    if (client) client.release();
  }

  // Só alertas médios ou altos notificam a comunidade; os restantes ficam registados.
  const nivelNormalizado = String(nivel).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const deveNotificar = ['medio', 'alto'].includes(nivelNormalizado);

  // Consulta contactos ativos dos distritos associados ao alerta já confirmado na base.
  try {
    const destinatarios = deveNotificar
      ? await pool.query(
        'SELECT telefone FROM utilizadores_comunidade WHERE distrito_id = ANY($1::int[]) AND ativo = TRUE',
        [distritos_ids],
      )
      : { rows: [] };

    // Dispara os pedidos em paralelo e contém a falha de cada destinatário individualmente.
    const resultados = await Promise.all(destinatarios.rows.map(async (utilizador) => {
      try {
        return await enviarSMS(utilizador.telefone, mensagem);
      } catch (error) {
        console.error(`Falha ao preparar SMS para ${utilizador.telefone}:`, error.message);
        return { sucesso: false, simulado: false, erro: error.message };
      }
    }));
    const enviadosReais = resultados.filter((resultado) => resultado.sucesso && !resultado.simulado).length;
    const simulados = resultados.filter((resultado) => resultado.sucesso && resultado.simulado).length;
    const falhados = resultados.filter((resultado) => !resultado.sucesso).length;

    return res.status(201).json({
      alerta,
      sms: {
        destinatarios: destinatarios.rows.length,
        enviados_reais: enviadosReais,
        simulados,
        falhados,
        ignorado_por_nivel: !deveNotificar,
      },
    });
  } catch (error) {
    // O alerta já foi guardado; informa o operador sem sugerir que a criação falhou.
    console.error('Alerta criado, mas não foi possível preparar os SMS:', error.message);
    return res.status(201).json({
      alerta,
      sms: { destinatarios: null, enviados_reais: 0, simulados: 0, falhados: null, erro: 'Não foi possível consultar os contactos.' },
    });
  }
});

// Retorna indicadores para o painel, usando 24 horas como janela provisória de alerta ativo.
app.get('/api/painel', async (_req, res) => {
  try {
    const [utilizadores, alertas, reportes, confirmacoes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM utilizadores_comunidade'),
      pool.query(`SELECT COUNT(*)::int AS total FROM alertas WHERE emitido_em >= NOW() - INTERVAL '24 hours'`),
      pool.query(`
        SELECT r.id, r.tipo, r.descricao, r.criado_em, r.distrito_id, d.nome AS distrito,
               r.alerta_id, u.telefone
        FROM reportes r LEFT JOIN distritos d ON d.id = r.distrito_id
        LEFT JOIN utilizadores_comunidade u ON u.id = r.utilizador_id
        ORDER BY r.criado_em DESC LIMIT 10
      `),
      pool.query(`SELECT COUNT(*)::int AS total FROM confirmacoes c JOIN alertas a ON a.id = c.alerta_id WHERE a.emitido_em >= NOW() - INTERVAL '24 hours'`),
    ]);
    res.json({ utilizadores_total: utilizadores.rows[0].total, alertas_ativos: alertas.rows[0].total,
      confirmacoes_recebidas: confirmacoes.rows[0].total, reportes_recentes: reportes.rows });
  } catch (error) {
    console.error('Erro ao carregar painel:', error);
    res.status(500).json({ erro: 'Não foi possível carregar o painel.' });
  }
});

// Lista alertas recentes dos distritos do utilizador para a tela comunitária.
app.get('/api/alertas/ativos', async (req, res) => {
  const { distrito_id } = req.query;
  if (!distrito_id) return res.status(400).json({ erro: 'distrito_id é obrigatório.' });
  try {
    const result = await pool.query(`
      SELECT a.id, a.tipo_desastre, a.nivel, a.mensagem, a.emitido_em, a.score_ia
      FROM alertas a JOIN alertas_distritos ad ON ad.alerta_id = a.id
      WHERE ad.distrito_id = $1 AND a.emitido_em >= NOW() - INTERVAL '24 hours'
      ORDER BY a.emitido_em DESC
    `, [distrito_id]);
    res.json({ alertas: result.rows });
  } catch (error) {
    console.error('Erro ao carregar alertas ativos:', error);
    res.status(500).json({ erro: 'Não foi possível carregar os alertas.' });
  }
});

// Guarda uma confirmação de receção após validar as duas referências.
app.post('/api/confirmacoes', async (req, res) => {
  const { alerta_id, utilizador_id } = req.body;
  if (!alerta_id || !utilizador_id) return res.status(400).json({ erro: 'alerta_id e utilizador_id são obrigatórios.' });
  try {
    const result = await pool.query(`
      INSERT INTO confirmacoes (alerta_id, utilizador_id)
      SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM alertas WHERE id = $1)
        AND EXISTS (SELECT 1 FROM utilizadores_comunidade WHERE id = $2)
      RETURNING id, alerta_id, utilizador_id, confirmado_em
    `, [alerta_id, utilizador_id]);
    if (!result.rowCount) return res.status(404).json({ erro: 'Alerta ou utilizador não encontrado.' });
    res.status(201).json({ confirmacao: result.rows[0] });
  } catch (error) {
    console.error('Erro ao guardar confirmação:', error);
    res.status(500).json({ erro: 'Não foi possível guardar a confirmação.' });
  }
});

// Guarda reportes de campo e valida referências obrigatórias e alerta opcional.
app.post('/api/reportes', async (req, res) => {
  const { utilizador_id, distrito_id, alerta_id = null, tipo, descricao } = req.body;
  if (!utilizador_id || !distrito_id || !tipo?.trim() || typeof descricao !== 'string' || !descricao.trim()) {
    return res.status(400).json({ erro: 'utilizador_id, distrito_id, tipo e descricao são obrigatórios.' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO reportes (utilizador_id, distrito_id, alerta_id, tipo, descricao)
      SELECT $1, $2, $3, $4, $5
      WHERE EXISTS (SELECT 1 FROM utilizadores_comunidade WHERE id = $1)
        AND EXISTS (SELECT 1 FROM distritos WHERE id = $2)
        AND ($3::int IS NULL OR EXISTS (SELECT 1 FROM alertas WHERE id = $3))
      RETURNING id, utilizador_id, distrito_id, alerta_id, tipo, descricao, criado_em
    `, [utilizador_id, distrito_id, alerta_id, tipo.trim(), descricao.trim()]);
    if (!result.rowCount) return res.status(404).json({ erro: 'Utilizador, distrito ou alerta não encontrado.' });
    res.status(201).json({ reporte: result.rows[0] });
  } catch (error) {
    console.error('Erro ao guardar reporte:', error);
    res.status(500).json({ erro: 'Não foi possível guardar o reporte.' });
  }
});

// Mostra histórico com operador responsável e distritos relacionados.
app.get('/api/historico', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.tipo_desastre, a.nivel, a.mensagem, a.emitido_em, a.score_ia,
             a.justificacao_ajuste, a.operador_id, o.nome AS operador_nome,
             COALESCE(json_agg(DISTINCT jsonb_build_object('id', d.id, 'nome', d.nome))
               FILTER (WHERE d.id IS NOT NULL), '[]'::json) AS distritos
      FROM alertas a LEFT JOIN operadores_cenoe o ON o.id = a.operador_id
      LEFT JOIN alertas_distritos ad ON ad.alerta_id = a.id
      LEFT JOIN distritos d ON d.id = ad.distrito_id
      GROUP BY a.id, o.nome ORDER BY a.emitido_em DESC LIMIT 100
    `);
    res.json({ historico: result.rows });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.status(500).json({ erro: 'Não foi possível carregar o histórico.' });
  }
});

// Inicializa o servidor quando este módulo é iniciado diretamente.
const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log(`Servidor a correr na porta ${PORT}`));
module.exports = app;

