/**
 * Classifica condições de cheia e ciclone com regras determinísticas.
 *
 * Entrada esperada:
 * - `nivel`: nível observado do rio, em metros;
 * - `atencao` e `emergencia`: cotas da estação, na mesma unidade;
 * - `chuva`: precipitação prevista para 24 horas, em milímetros;
 * - `ciclone`: descrição textual do estado meteorológico.
 *
 * Esta função não procura dados no banco nem verifica a idade deles. A rota
 * `/api/risco/:distritoId` faz essa validação antes de chamar o classificador.
 * Se os valores numéricos forem inválidos, devolve `indisponivel` sem score.
 */
function calcularClassificacao({ nivel, atencao, emergencia, chuva, ciclone }) {
  const entradas = [nivel, atencao, emergencia, chuva];
  const valores = entradas.map(Number);

  // Sem medida, chuva negativa ou cotas invertidas, qualquer score seria enganador.
  if (entradas.some((valor) => valor == null || valor === '')
    || typeof ciclone !== 'string' || !ciclone.trim()
    || !valores.every(Number.isFinite)
    || valores[0] < 0 || valores[1] < 0 || valores[2] <= valores[1] || valores[3] < 0) {
    return { score: null, nivel: 'indisponivel', detalhes: null };
  }

  [nivel, atencao, emergencia, chuva] = valores;
  let rio;

  // Rio: abaixo da atenção varia de 0 a 50; entre cotas, de 50 a 100;
  // ao atingir a emergência, o componente fica em 100.
  if (nivel >= emergencia) rio = 100;
  else if (nivel >= atencao) rio = 50 + 50 * ((nivel - atencao) / Math.max(emergencia - atencao, 0.1));
  else rio = 50 * (nivel / Math.max(atencao, 0.1));

  // Chuva: 120 mm/24h ou mais corresponde a 100; valores menores são proporcionais.
  const chuvaScore = Math.min(100, Math.max(0, (chuva / 120) * 100));
  // O estado é binário nesta versão: ausência explícita vale 0; qualquer outro
  // estado preenchido vale 100. A origem e a qualidade do texto devem ser validadas.
  const cicloneScore = /nenhum|normal|sem/i.test(String(ciclone || '')) ? 0 : 100;

  // Combina os componentes: rio 50%, chuva 30% e ciclone 20%.
  const ponderado = Math.round(rio * 0.5 + chuvaScore * 0.3 + cicloneScore * 0.2);

  // A soma ponderada isolada limita ciclone a 20 pontos. Um nível severo
  // explicitamente vermelho/intenso recebe score mínimo 65 para garantir risco alto.
  const cicloneVermelho = /vermelho|severo|intenso/i.test(String(ciclone || ''));
  const score = cicloneVermelho ? Math.max(65, ponderado) : ponderado;

  // Limiares do protótipo: 0–29 baixo, 30–64 médio e 65–100 alto.
  const nivelRisco = score >= 65 ? 'alto' : score >= 30 ? 'medio' : 'baixo';

  return {
    score,
    nivel: nivelRisco,
    detalhes: {
      rio: Math.round(rio),
      chuva: Math.round(chuvaScore),
      ciclone: cicloneScore,
    },
  };
}

module.exports = { calcularClassificacao };
