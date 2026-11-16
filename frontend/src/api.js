// Centraliza chamadas HTTP para manter os componentes focados na interface.
// Endereço base substituível por ambiente, sem alterar os componentes.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Lê JSON da resposta e transforma mensagens HTTP em erros úteis à interface.
async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.erro || 'Não foi possível concluir o pedido.');
  return payload;
}

// Constrói pedidos JSON para operações de escrita.
const post = (dados) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });

// Expõe as operações utilizadas pelas telas de operador e comunidade.
export const api = {
  getDistritos: () => request('/distritos'),
  getComunidades: (distritoId) => request(`/comunidades?distrito_id=${encodeURIComponent(distritoId)}`),
  getRisco: (distritoId) => request(`/risco/${encodeURIComponent(distritoId)}`),
  getPainel: () => request('/painel'),
  getAlertasAtivos: (distritoId) => request(`/alertas/ativos?distrito_id=${encodeURIComponent(distritoId)}`),
  registar: (dados) => request('/utilizadores', post(dados)),
  enviarAlerta: (dados) => request('/alertas', post(dados)),
  confirmar: (dados) => request('/confirmacoes', post(dados)),
  reportar: (dados) => request('/reportes', post(dados)),
};
