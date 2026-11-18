// Registos fictícios e claramente identificados para ensaiar a apresentação.
export const DADOS_PAINEL_DEMONSTRACAO = {
  utilizadores_total: 42,
  alertas_ativos: 3,
  confirmacoes_recebidas: 18,
  alertas: [
    { id: 'demo-alert-1', distrito: 'Mocuba', perigo: 'Cheia', nivel: 'alto', confirmacoes: 12, total: 20, emitido: 'há 8 min' },
    { id: 'demo-alert-2', distrito: 'Namacurra', perigo: 'Cheia', nivel: 'alto', confirmacoes: 4, total: 12, emitido: 'há 21 min' },
    { id: 'demo-alert-3', distrito: 'Maganja da Costa', perigo: 'Ciclone', nivel: 'médio', confirmacoes: 2, total: 10, emitido: 'há 37 min' },
  ],
  reportes_recentes: [
    { id: 'demo-1', tipo: 'Subida do nível do rio', descricao: 'Água próxima do limite de atenção na zona ribeirinha.', distrito: 'Mocuba', criado_em: new Date(Date.now() - 12 * 60_000).toISOString() },
    { id: 'demo-2', tipo: 'Chuva intensa', descricao: 'Precipitação forte observada durante a última hora.', distrito: 'Namacurra', criado_em: new Date(Date.now() - 24 * 60_000).toISOString() },
    { id: 'demo-3', tipo: 'Via condicionada', descricao: 'Acesso baixo com circulação limitada por acumulação de água.', distrito: 'Maganja da Costa', criado_em: new Date(Date.now() - 46 * 60_000).toISOString() },
  ],
};
