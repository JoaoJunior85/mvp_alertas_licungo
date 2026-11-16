// Testes unitários do adaptador SMS; não fazem chamadas de rede nem consomem créditos.
const test = require('node:test');
const assert = require('node:assert/strict');
const { enviarSMS, formatarTelefone } = require('./smsService');

test('normaliza números nacionais e internacionais para +258', () => {
  assert.equal(formatarTelefone('840000001'), '+258840000001');
  assert.equal(formatarTelefone('258 84 000 0001'), '+258840000001');
  assert.equal(formatarTelefone('+258840000001'), '+258840000001');
  assert.throws(() => formatarTelefone('123'), /inválido/);
});

test('simula SMS e não tenta usar a rede quando não há chave', async () => {
  const chaveAnterior = process.env.SMS_API_KEY;
  const logAnterior = console.log;
  const linhas = [];
  delete process.env.SMS_API_KEY;
  console.log = (linha) => linhas.push(linha);

  try {
    const resultado = await enviarSMS('840000001', 'Alerta de teste');
    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.simulado, true);
    assert.match(linhas[0], /\[SMS SIMULADO\].*\+258840000001.*Alerta de teste/);
  } finally {
    console.log = logAnterior;
    if (chaveAnterior === undefined) delete process.env.SMS_API_KEY;
    else process.env.SMS_API_KEY = chaveAnterior;
  }
});

test('envia ao endpoint configurado no serviço com autenticação e remetente', async () => {
  const chaveAnterior = process.env.SMS_API_KEY;
  const remetenteAnterior = process.env.SMS_SENDER_ID;
  const fetchAnterior = global.fetch;
  let pedido;
  process.env.SMS_API_KEY = 'chave-de-teste';
  process.env.SMS_SENDER_ID = 'INGD-TESTE';
  global.fetch = async (url, options) => {
    pedido = { url, options };
    return { ok: true, status: 200, json: async () => ({ id: 'sms-1', status: 'queued' }) };
  };

  try {
    const resultado = await enviarSMS('840000001', 'Alerta de teste');
    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.simulado, false);
    assert.equal(pedido.url, 'https://api.esmsafrica.io/v1/sms/send');
    assert.equal(pedido.options.headers.Authorization, 'Bearer chave-de-teste');
    assert.deepEqual(JSON.parse(pedido.options.body), {
      to: '+258840000001',
      from: 'INGD-TESTE',
      message: 'Alerta de teste',
    });
  } finally {
    global.fetch = fetchAnterior;
    if (chaveAnterior === undefined) delete process.env.SMS_API_KEY;
    else process.env.SMS_API_KEY = chaveAnterior;
    if (remetenteAnterior === undefined) delete process.env.SMS_SENDER_ID;
    else process.env.SMS_SENDER_ID = remetenteAnterior;
  }
});

test('devolve falha controlada quando o fornecedor rejeita o pedido', async () => {
  const chaveAnterior = process.env.SMS_API_KEY;
  const fetchAnterior = global.fetch;
  const logErroAnterior = console.error;
  process.env.SMS_API_KEY = 'chave-de-teste';
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { message: 'Chave inválida.' } }),
  });
  console.error = () => {};

  try {
    const resultado = await enviarSMS('840000001', 'Alerta de teste');
    assert.equal(resultado.sucesso, false);
    assert.equal(resultado.simulado, false);
    assert.match(resultado.erro, /Chave inválida/);
  } finally {
    global.fetch = fetchAnterior;
    console.error = logErroAnterior;
    if (chaveAnterior === undefined) delete process.env.SMS_API_KEY;
    else process.env.SMS_API_KEY = chaveAnterior;
  }
});

test('conta a resposta sandbox do fornecedor como simulada', async () => {
  const chaveAnterior = process.env.SMS_API_KEY;
  const fetchAnterior = global.fetch;
  process.env.SMS_API_KEY = 'esms_test-chave';
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 'test-1', status: 'queued', environment: 'test', livemode: false }),
  });

  try {
    const resultado = await enviarSMS('840000001', 'Alerta de teste');
    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.simulado, true);
  } finally {
    global.fetch = fetchAnterior;
    if (chaveAnterior === undefined) delete process.env.SMS_API_KEY;
    else process.env.SMS_API_KEY = chaveAnterior;
  }
});
