// Regras de apresentação partilhadas pelas vistas do protótipo.
// Metadados visuais e mensagens; a classificação numérica fica no backend.
export const RISK = {
  baixo: { name: 'Baixo', color: '#10B981', advice: 'Acompanhe as atualizações oficiais.' },
  medio: { name: 'Médio', color: '#F59E0B', advice: 'Prepare documentos e evite atravessar zonas alagadas.' },
  alto: { name: 'Alto', color: '#EF4444', advice: 'Procure abrigo seguro e siga as instruções das autoridades.' },
  indisponivel: { name: 'Indisponível', color: '#64748B', advice: 'Dados insuficientes ou desatualizados. Aguarde validação do operador.' },
};

export const meta = (level) => RISK[String(level || 'indisponivel').toLowerCase().replace('é', 'e')] || RISK.indisponivel;
