// Cliente HTTP da API Python; mantém URL, timeout e contrato fora das rotas Express.
const API_URL = (process.env.RISK_MODEL_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
// O plano gratuito pode acordar o container do modelo com uma demora próxima de um minuto.
const API_TIMEOUT_MS = Number(process.env.RISK_MODEL_TIMEOUT_MS || 90_000);

// 14 campos de entrada do serviço Python constroem as 13 features treinadas;
// nenhum deles equivale diretamente às medições atuais do Supabase.
const CAMPOS_MODELO = [
  'annual_precipitation',
  'precipitation_of_wettest_month',
  'precipitation_seasonality',
  'drainage_density',
  'drainage_texture',
  'basin_relief',
  'annual_mean_temperature',
  'temperature_seasonality',
  'curve_number_amcii',
  'ruggedness_number',
  'infiltration_number',
  'climate_type',
  'landcover_type',
  'soil_type',
];

// Valida o contrato antes de encaminhar os dados ao processo Python.
function validarFeaturesModelo(features) {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return 'Envie um objeto com as variáveis requeridas pelo modelo.';
  }

  const ausentes = CAMPOS_MODELO.filter((campo) => !(campo in features));
  if (ausentes.length) return `Variáveis em falta: ${ausentes.join(', ')}.`;

  const invalidos = CAMPOS_MODELO.filter((campo) =>
    typeof features[campo] !== 'number' || !Number.isFinite(features[campo]));
  if (invalidos.length) return `Variáveis numéricas inválidas: ${invalidos.join(', ')}.`;

  const categorias = ['climate_type', 'landcover_type', 'soil_type'];
  const categoriaInvalida = categorias.find((campo) =>
    !Number.isInteger(features[campo]) || features[campo] < 0 || features[campo] > 5);
  if (categoriaInvalida) return `${categoriaInvalida} deve ser um inteiro entre 0 e 5.`;

  return null;
}

// Envia a matriz ao endpoint do modelo e confirma que a saída pode ser interpretada.
async function preverRiscoInundacao(features) {
  const erroValidacao = validarFeaturesModelo(features);
  if (erroValidacao) {
    const error = new Error(erroValidacao);
    error.statusCode = 400;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MODEL_API_TOKEN) headers.Authorization = `Bearer ${process.env.MODEL_API_TOKEN}`;

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify(features),
      signal: controller.signal,
    });
    const prediction = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(prediction.detail || `API do modelo respondeu HTTP ${response.status}.`);
      error.statusCode = 502;
      throw error;
    }

    const score = Number(prediction.flood_risk_score);
    const nivel = String(prediction.risk_level || '').toUpperCase();
    if (!Number.isFinite(score) || score < 0 || score > 1 || !['LOW', 'MEDIUM', 'HIGH'].includes(nivel)) {
      const error = new Error('A API do modelo devolveu uma classificação inválida.');
      error.statusCode = 502;
      throw error;
    }

    return {
      ...prediction,
      flood_risk_score: score,
      nivel: { LOW: 'baixo', MEDIUM: 'medio', HIGH: 'alto' }[nivel],
      tipo_modelo: 'suscetibilidade_a_inundacao',
    };
  } catch (error) {
    if (error.statusCode) throw error;

    const indisponivel = new Error(
      error.name === 'AbortError'
        ? 'A API Python excedeu o tempo limite.'
        : `A API Python do modelo está indisponível. Confirma que o serviço está ativo em ${API_URL}.`,
    );
    indisponivel.statusCode = 503;
    throw indisponivel;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { preverRiscoInundacao, validarFeaturesModelo, CAMPOS_MODELO };
