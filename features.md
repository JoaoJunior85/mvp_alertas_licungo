# Funcionalidades implementadas

## Tarefa 1 — Backend

- `backend/src/server.js`: painel com total de utilizadores, alertas das últimas 24 horas, confirmações e reportes recentes; confirmação de alertas; criação de reportes; histórico com operador e distritos.
- `features.md`: regista as rotas e a regra provisória de 24 horas, pois o esquema ainda não tem estado ou expiração para alertas.

## Tarefas 2 e 3 — Operador e Comunidade

- `backend/src/server.js`: disponibiliza distritos/comunidades, classifica risco com pesos de rio (50%), chuva (30%) e ciclone (20%), regista utilizadores, emite alertas em transação e lista alertas recentes por distrito.
- `frontend/src/api.js`: centraliza chamadas à API e mensagens de erro; suporta URL configurável por `VITE_API_URL`.
- `frontend/src/App.jsx`: painel do operador com mapa OpenStreetMap interativo, marcadores por nível de risco, análise e classificação manual justificada, emissão de alerta, indicadores, confirmações e reportes recentes.
- `frontend/src/App.jsx`: registo comunitário com distrito e comunidade carregados da API, alertas da zona, confirmação de receção e modal para reportar ocorrências.
- `frontend/src/index.css` e `frontend/index.html`: sistema visual responsivo, tema escuro para o operador, tema claro para a comunidade, animações leves e metadados em português.
- `frontend/package.json` e `frontend/package-lock.json`: adicionadas as dependências `leaflet` e `react-leaflet` para o mapa.
- Ícones de interface: Lucide React, já existente no projeto, com símbolos de rio, chuva, vento, telefone, alerta, confirmação e reporte.

### Premissas e dependências

- Os distritos precisam existir no banco; as coordenadas do mapa são pontos de referência visuais e não polígonos administrativos.
- O registo procura um telefone existente e atualiza a localização sem depender de `UNIQUE`; para evitar duplicados concorrentes, recomenda-se adicionar essa restrição no banco.
- Alertas ativos são os emitidos nas últimas 24 horas, até existir regra/campo de encerramento.
- O identificador do operador de demonstração é `1`, como no protótipo inicial. A rota guarda o alerta no banco; não existe ainda integração com um fornecedor SMS.



## Redesign de UI/UX — Design System

- `frontend/src/index.css`: fontes Google Outfit (títulos), Inter (interface) e JetBrains Mono (dados); paletas Oceanic Dark e Comunidade Clean; estados de foco, transições, glassmorphism e tamanhos maiores para uso móvel.
- `frontend/tailwind.config.js`: tokens de cores, famílias tipográficas e animações `risk-pulse` e `fade-up`, usados com o plugin Tailwind 4 do Vite.
- `frontend/src/App.jsx`: entrada e painéis atualizados visualmente; cartão comunitário e ações ampliados; círculo do distrito em alto risco e respetivo ícone pulsantes; mapa CartoDB Dark Matter integrado na sala de operações.
- O redesign preserva as chamadas API e os fluxos de negócio existentes.

### Tokens visuais adotados

- Tipografia: Outfit para títulos, Inter para interface e JetBrains Mono para números, scores e telefones.
- Risco: baixo `#10B981`, médio `#F59E0B`, alto `#EF4444`.
- Operador: fundo `#0F172A`, cartões `#1E293B`, bordas `#334155`, texto `#F8FAFC`, secundário `#94A3B8`, ação `#3B82F6`.
- Comunidade: fundo `#F8FAFC`, cartões `#FFFFFF`, texto `#0F172A`, ação `#2563EB`.

## Correções de identidade, mapa e arquitetura frontend

- `frontend/img/logo-removebg-preview.png`: usada como marca transparente nos cabeçalhos da entrada, operador e comunidade.
- `frontend/src/App.jsx`: reduzido ao roteamento principal.
- `frontend/src/components/`: telas separadas em `EntryScreen.jsx`, `OperatorScreen.jsx`, `CommunityScreen.jsx`, `RiskMap.jsx` e `Brand.jsx`.
- `frontend/src/constants/risk.js` e `frontend/src/utils/dateLabel.js`: centralizam cores/descrições de risco e formatação de datas.
- `frontend/src/components/RiskMap.jsx`: substituído CartoDB (que apresentava “API KEY REQUIRED”) pelos tiles públicos do OpenStreetMap, mantendo o mapa em visual escuro via filtro CSS. A tela mostrava os indicadores da API de dados; a chave em falta era apenas do fornecedor de mapas.
- Removido o rótulo “Sistema de demonstração” da entrada e reforçada a escala tipográfica do painel operacional.

## Refinamento de UI/UX: Implementação de mapa claro (CartoDB), ajuste tipográfico e melhorias de contraste

- `frontend/src/components/RiskMap.jsx`: CartoDB Positron quando `VITE_CARTO_API_KEY` está configurada; OSM claro como fallback para manter o mapa acessível sem chave. Marcadores com preenchimento de alto contraste e contorno branco espesso. O template da variável está em `frontend/.env.example`.
- `frontend/src/components/Brand.jsx` e `frontend/src/index.css`: logo ampliada, fundo em gradiente e brilho subtil para separação do cabeçalho.
- `frontend/src/index.css`: subtítulo comunitário ampliado, inputs mais altos, títulos reforçados, animações suaves, hover tátil e cartões operacionais com gradiente e borda superior codificada por cor.
- `frontend/tailwind.config.js`: mantém as animações reutilizáveis `fade-up` e `risk-pulse` configuradas no Design System.
- Nenhuma chamada da API ou lógica de negócio foi alterada.


## Ajuste de legibilidade da marca e da comunidade

- `frontend/src/index.css`: escurecido o wordmark LICUNGO no cabeçalho claro e ampliados a logo, o subtítulo da marca, os ícones e os textos da lista de benefícios, com tamanhos próprios para mobile.

## UI/UX: Contexto Visual e Memória Histórica

- `frontend/public/images/historico-cheia.jpg` e `historico-ciclone.jpg`: imagens disponibilizadas pelos ficheiros existentes em `frontend/img` e servidas pelo diretório público.
- `frontend/src/components/CartaoMemoriaHistorica.jsx`: cartão reutilizável na comunidade, abaixo do registo e do risco atual, com imagem em escala de cinza que ganha cor no hover, gradiente, texto acessível e badge.
- `frontend/src/components/ContextoHistoricoCritico.jsx`: aviso visual com miniatura e `AlertTriangle`, mostrado na validação T09 apenas quando `risk.nivel === 'alto'`.
- `frontend/src/components/EntryScreen.jsx` e `frontend/src/index.css`: marca da entrada recebe um fundo claro e brilho subtil para continuar legível no fundo escuro.
- O operador recebe contexto histórico quando o motor classifica risco alto; a mensagem não afirma que existe comparação algorítmica com eventos passados, pois essa lógica não faz parte do motor atual.

## Refinamento de tema, legibilidade e espaçamento

- `frontend/src/components/OperatorScreen.jsx`: adicionado botão claro/escuro no painel; preferência guardada em `localStorage` sem alterar chamadas ou regras da API.
- `frontend/src/index.css`: criado tema claro para cartões, navegação, controlos e textos; reforçado contraste do tema escuro; alargados o painel e a tela comunitária; reduzidas margens laterais; ampliada a tipografia e os cartões da entrada.

## Lista de atividades para finalizar o protótipo

### MVP académico — prioridade alta

- [x] Corrigir a classificação quando não há leituras ou estas estão desatualizadas; não apresentar risco baixo por omissão.
- [ ] Confirmar com o orientador se o motor de regras ponderado é suficiente para a demonstração, ou se é exigido um modelo ML treinado.
- [x] Documentar cenários simulados de rio, chuva e ciclone; a inserção dos registos concretos depende dos IDs disponíveis no banco local.
- [ ] Validar os pesos e limiares do motor com cenários baixos, médios, altos, dados ausentes e limites das cotas.
- [x] Criar testes automatizados para o classificador (cenários altos, médio e inválidos); faltam testes dos fluxos dependentes do banco e do frontend.
- [ ] Fazer uma passagem ponta a ponta: registo, cálculo, validação, emissão, confirmação comunitária e reporte.
- [x] Rever `features.md` e separar cenário simulado, limitações e funcionalidades existentes.

### Antes de qualquer uso operacional

- [ ] Integrar fontes autorizadas e atualizadas do INAM e ARA-Centro com validação de unidade, timestamp, falhas e proveniência.
- [ ] Integrar um fornecedor de SMS e testar entrega, erros, reenvio e destinatários por distrito.
- [ ] Implementar autenticação e papéis; substituir o operador fixo de demonstração `operador_id: 1`.
- [ ] Rever CORS, acesso à base, proteção de credenciais, limites das rotas e registo de auditoria.
- [ ] Calibrar o classificador com especialistas e dados históricos locais; medir especialmente alertas altos não detetados.
- [ ] Definir procedimento de operação, responsáveis pela validação e plano de resposta a falhas/alertas.
- [ ] Configurar ambientes de produção, domínio, observabilidade, cópias de segurança e recuperação.

### Cenário manual — dados simulados

## Alterações desta fase

- Classificação indisponível quando dados do rio (mais de 6 horas), meteorologia (mais de 24 horas), valores ou timestamps não são válidos. Um estado de ciclone identificado como vermelho, severo ou intenso classifica risco alto.
- Cenários de cheia vermelha, ciclone vermelho, ausência de dados e dados vencidos documentados abaixo.
- A validação automatizada de interface disponível é `npm run lint` e `npm run build`; ambos executados nesta fase. O lint reporta dois avisos existentes sobre atualizações de estado em efeitos.
- A classificação foi extraída para `backend/src/services/risk.js`; `npm test` cobre cheia acima da cota, ciclone vermelho, risco médio e entradas inválidas.
- Os pesos continuam provisórios. Os testes de emissão/ajuste, confirmação, reporte e frontend ainda precisam de uma base de teste configurada.
- A passagem ponta a ponta requer `DATABASE_URL` e registos no banco configurado; não foi executada neste ambiente.

Os valores seguintes são fictícios, apenas para demonstração académica. Não representam medições oficiais nem devem orientar decisões operacionais. Inserir leituras associadas a estações e distritos já existentes, com timestamps atuais e cotas configuradas no banco.

| Caso | Distrito | Leitura simulada | Esperado |
|---|---|---|---|
| Cheia vermelha | Mocuba | Rio acima da cota de emergência; chuva 160 mm/24h; sem ciclone | Risco alto, detalhe do rio 100 |
| Ciclone vermelho | Namacurra | Rio abaixo da cota de atenção; chuva 40 mm/24h; estado de ciclone `Alerta vermelho` | Risco alto, detalhe do ciclone 100 |
| Dados ausentes | Maganja da Costa | Sem leitura do rio | Indisponível; alerta não pode ser emitido |
| Dados vencidos | Qualquer distrito | Rio com mais de 6 h ou meteorologia com mais de 24 h | Indisponível; alerta não pode ser emitido |

Validar cada caso em `GET /api/risco/:distritoId`, conferir nível, score, `dados_disponiveis` e timestamps. Para os casos vermelhos, emitir o alerta no painel; registar um contacto comunitário, confirmar receção e enviar reporte. Consultar `/api/alertas/ativos` e `/api/painel`. Os registos dependem dos IDs existentes no banco configurado.

### Limitações e trabalho fora do MVP

Para a explicação da fórmula, o mapa dos módulos e os pressupostos do classificador, consultar [docs/ARQUITETURA_E_CLASSIFICACAO.md](docs/ARQUITETURA_E_CLASSIFICACAO.md).

- [ ] Treinar e avaliar um modelo ML com séries históricas rotuladas, validação temporal e comparação com o motor de regras atual.
