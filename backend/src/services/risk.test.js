// Testes puros da fórmula: não precisam de banco de dados nem API ativa.
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularClassificacao } = require('./risk');

const base = { nivel: 5, atencao: 10, emergencia: 20, chuva: 0, ciclone: 'Nenhum' };

test('classifica cheia acima da cota de emergência como risco alto', () => {
  const resultado = calcularClassificacao({ ...base, nivel: 20, chuva: 120 });
  assert.equal(resultado.nivel, 'alto');
  assert.equal(resultado.detalhes.rio, 100);
});

test('classifica ciclone explicitamente vermelho como risco alto', () => {
  const resultado = calcularClassificacao({ ...base, ciclone: 'Alerta vermelho' });
  assert.equal(resultado.nivel, 'alto');
  assert.equal(resultado.score, 65);
});

test('preserva o nível médio para indicadores intermédios', () => {
  const resultado = calcularClassificacao({ ...base, nivel: 8, chuva: 80 });
  assert.equal(resultado.nivel, 'medio');
});

test('rejeita indicadores ausentes e cotas inválidas', () => {
  assert.equal(calcularClassificacao({ ...base, nivel: null }).nivel, 'indisponivel');
  assert.equal(calcularClassificacao({ ...base, atencao: 20, emergencia: 10 }).nivel, 'indisponivel');
  assert.equal(calcularClassificacao({ ...base, ciclone: '' }).nivel, 'indisponivel');
});

test('converte cotas numéricas em texto antes de as comparar', () => {
  const resultado = calcularClassificacao({
    nivel: '5', atencao: '2', emergencia: '10', chuva: '0', ciclone: 'Normal',
  });
  assert.notEqual(resultado.nivel, 'indisponivel');
  assert.equal(resultado.detalhes.rio, 69);
});
