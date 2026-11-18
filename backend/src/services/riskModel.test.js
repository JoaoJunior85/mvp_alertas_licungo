// Verifica a fronteira de dados do modelo sem iniciar Python ou fazer pedidos HTTP.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CAMPOS_MODELO, validarFeaturesModelo, preverRiscoInundacao } = require('./riskModel');

const dadosValidos = Object.fromEntries(CAMPOS_MODELO.map((campo) => [campo, 1]));

test('aceita as 14 entradas usadas para construir as 13 features do XGBoost', () => {
  assert.equal(CAMPOS_MODELO.length, 14);
  assert.equal(validarFeaturesModelo(dadosValidos), null);
});

test('rejeita variáveis em falta e números inválidos', () => {
  const { annual_precipitation: _removido, ...incompleto } = dadosValidos;
  assert.match(validarFeaturesModelo(incompleto), /annual_precipitation/);
  assert.match(validarFeaturesModelo({ ...dadosValidos, drainage_density: Infinity }), /drainage_density/);
});

test('rejeita códigos categóricos fora do intervalo documentado', () => {
  assert.match(validarFeaturesModelo({ ...dadosValidos, climate_type: 6 }), /climate_type/);
});

test('encaminha as entradas à API Python e normaliza o nível devolvido', async () => {
  const fetchAnterior = global.fetch;
  let pedido;
  global.fetch = async (url, options) => {
    pedido = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        flood_risk_score: 0.82,
        risk_percentage: '82%',
        risk_level: 'HIGH',
        message: 'High flood risk.',
        features_used: 13,
      }),
    };
  };

  try {
    const previsao = await preverRiscoInundacao(dadosValidos);
    assert.equal(pedido.url, 'http://127.0.0.1:8000/predict');
    assert.equal(JSON.parse(pedido.options.body).annual_precipitation, 1);
    assert.equal(previsao.nivel, 'alto');
    assert.equal(previsao.tipo_modelo, 'suscetibilidade_a_inundacao');
  } finally {
    global.fetch = fetchAnterior;
  }
});
