// Isola o fornecedor SMS do resto da aplicação para permitir substituí-lo depois.
// As rotas chamam apenas `enviarSMS`; não conhecem endpoints nem credenciais do fornecedor.

// Normaliza números moçambicanos para o formato internacional esperado pela API.
function formatarTelefone(telefone) {
  const numero = String(telefone || '').trim().replace(/[\s()-]/g, '');
  const digitos = numero.replace(/^\+/, '');
  const internacional = digitos.startsWith('258')
    ? `+${digitos}`
    : `+258${digitos.startsWith('0') ? digitos.slice(1) : digitos}`;

  if (!/^\+258\d{9}$/.test(internacional)) {
    throw new Error(`Número moçambicano inválido: ${telefone}`);
  }

  return internacional;
}

// Envia um SMS real quando há chave configurada; sem chave, simula o envio no terminal.
async function enviarSMS(telefone, mensagem) {
  const apiKey = process.env.SMS_API_KEY?.trim();
  const destino = formatarTelefone(telefone);

  // O modo simulado permite testar a rota completa sem credenciais nem custo de SMS.
  if (!apiKey) {
    console.log(`📱 [SMS SIMULADO] Para: ${destino} | Mensagem: ${mensagem}`);
    return { sucesso: true, simulado: true, telefone: destino };
  }

  // O formato do pedido segue a API REST e a autenticação Bearer do eSMS Africa.
  try {
    const resposta = await fetch('https://api.esmsafrica.io/v1/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: destino,
        from: process.env.SMS_SENDER_ID?.trim() || 'INGD',
        message: String(mensagem),
      }),
    });

    const dados = await resposta.json().catch(() => ({}));
    const estado = String(dados.status || '').toLowerCase();
    if (!resposta.ok || dados.success === false || ['failed', 'error'].includes(estado)) {
      throw new Error(dados.message || dados.error?.message || dados.error || `eSMS Africa respondeu HTTP ${resposta.status}.`);
    }

    const modoTeste = dados.livemode === false || String(dados.environment || '').toLowerCase() === 'test';
    return { sucesso: true, simulado: modoTeste, telefone: destino, resposta: dados };
  } catch (error) {
    console.error(`Falha ao enviar SMS para ${destino}:`, error.message);
    return { sucesso: false, simulado: false, telefone: destino, erro: error.message };
  }
}

module.exports = { enviarSMS, formatarTelefone };
