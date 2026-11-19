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

## Backend: Integração de Serviço de SMS (Mock e Real)

- `backend/src/services/smsService.js` isola o envio SMS da rota, normaliza telefones moçambicanos para `+258` e prepara a substituição futura do fornecedor.
- Sem `SMS_API_KEY`, os envios são simulados e impressos no terminal como `[SMS SIMULADO]`; nenhuma chamada externa é feita.
- Com `SMS_API_KEY`, o serviço envia para a API REST do eSMS Africa usando `SMS_SENDER_ID` ou `INGD` como remetente. Respostas identificadas pelo fornecedor como sandbox são contadas como simuladas; a chave deve ficar apenas no `.env` do backend.
- `POST /api/alertas` guarda o alerta primeiro; para níveis médio e alto consulta os contactos com `ativo = TRUE` dos distritos afetados e dispara os SMS em paralelo. Falhas individuais não desfazem o alerta.
- A resposta regista os totais de destinatários, pedidos reais aceites pelo fornecedor, simulações e falhas. Aceitação pelo fornecedor não confirma entrega no telemóvel. O envio ainda é síncrono nesta versão; uma fila e callbacks de entrega são passos recomendados antes de uso operacional.
- `backend/.env.example` apresenta `SMS_API_KEY` e `SMS_SENDER_ID` sem credenciais. `backend/src/services/smsService.test.js` verifica formatação, simulação e contrato HTTP sem chamadas de rede.

## Backend: Integração do modelo XGBoost

- `backend/src/services/riskModel.js` valida as 14 entradas necessárias pelo endpoint Python e encaminha pedidos com timeout; erros e respostas fora do contrato são tratados como falha do serviço.
- `POST /api/risco/modelo` encaminha a previsão sem expor a API Python diretamente ao browser. Configure `RISK_MODEL_API_URL` no backend; por padrão usa `http://127.0.0.1:8000`.
- O painel usa esse proxy, mas a ação XGBoost continua identificada como demonstração: envia valores fixos de exemplo, não dados do Supabase. A previsão indica suscetibilidade à inundação e não substitui o risco atual calculado pelas regras.
- A demonstração foi executada de ponta a ponta: os valores fixos do painel passaram pelo backend Node e pela API Python, que carregou `flood_model.pkl` e devolveu score `0.0779` (7,8%), nível `LOW` e 13 features processadas. Isso comprova que o artefacto faz inferência; não comprova a precisão científica ou a adequação do resultado a um distrito real.
- Para reproduzir no Windows, abrir um terminal em `api-risco/api-py` e iniciar `.\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000`; deixar essa janela aberta. Em terminais separados, executar `npm run dev` em `backend` e em `frontend`; abrir a tela do operador e clicar em **Fazer análise de risco** no cartão XGBoost. O mesmo payload pode ser enviado a `POST /api/risco/modelo`.
- Ao carregar o artefacto, o ambiente reportou que o `LabelEncoder` foi guardado com scikit-learn 1.6.1 e está a ser aberto com 1.9.1, além de um aviso de serialização do XGBoost. A previsão respondeu, mas antes de uso prolongado é preciso recuperar as versões exatas do treino e fixá-las em `requirements.txt`.
- Para aplicar o modelo a Mocuba, Namacurra ou Maganja da Costa faltam fontes verificadas para as características de clima, relevo, drenagem, solo e cobertura terrestre usadas no treino. Não preencher estes campos com valores de exemplo para emitir alertas.
- A API Python requer as dependências em `api-risco/api-py/requirements.txt` e os artefactos do modelo. Se o ambiente virtual não existir, criar com `py -m venv .venv` e instalar com `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, sempre dentro de `api-risco/api-py`.

### Cenário de apresentação — inferência XGBoost com dados demonstrativos

Usar no cartão **Análise de risco** do operador. O painel já envia este conjunto fixo ao backend e o backend encaminha-o para `POST /predict` na API Python:

| Entrada | Valor demonstrativo |
|---|---:|
| Precipitação anual | 1200 mm/ano |
| Precipitação do mês mais chuvoso | 300 mm |
| Sazonalidade da precipitação | 50 |
| Densidade de drenagem | 2,5 km/km² |
| Textura de drenagem | 10 |
| Relevo da bacia | 500 m |
| Temperatura média anual | 20 °C |
| Sazonalidade da temperatura | 500 |
| Curve Number AMC II | 70 |
| Índice de rugosidade | 0,5 |
| Índice de infiltração | 5 |
| Códigos categóricos de clima / cobertura / solo | 2 / 1 / 3 |

**Resultado observado:** score `0.0779`, percentagem apresentada `7.8%`, classificação `LOW` (baixo), com 13 features utilizadas. Na apresentação, explicar que isto demonstra a execução do modelo e a integração entre frontend, backend e API Python; não é uma leitura real de Mocuba, Namacurra ou Maganja da Costa, nem uma medição de precisão do modelo. O botão não emite alerta nem SMS.

**Antes de abrir o painel:** iniciar a API Python pelo comando acima e manter essa janela aberta. Confirmar `http://127.0.0.1:8000/health` (deve indicar `running`, `XGBoost`, `13`) e então clicar **Fazer análise de risco**. O backend e o frontend precisam estar activos nas respectivas janelas.

## Preparação para hospedagem

- `docker-compose.yml` orquestra frontend Nginx, backend Node e API FastAPI/XGBoost; só o frontend publica a porta `8080`, enquanto Node e Python ficam na rede interna.
- Foram adicionados Dockerfiles, verificações de saúde, proxy `/api` e fallback SPA. O frontend usa `/api` por padrão; no desenvolvimento, o Vite encaminha esse prefixo ao backend local.
- `backend/.env.example` contém apenas placeholders. Crie `backend/.env`, configure `DATABASE_URL` e a origem pública em `CORS_ORIGIN`; mantenha `SMS_API_KEY` vazio para simulação.
- O procedimento de configuração, build e publicação está em [docs/HOSTING.md](docs/HOSTING.md). A construção local das imagens requer Docker Engine e Docker Compose.
- A imagem Render da API de risco é autónoma: o Dockerfile copia `api.py` e os três artefactos versionados em `deployment/risk-model/model`, sem depender de o Render inicializar o submódulo Git.

## UI/UX: Upgrade da Sidebar para Estilo War Room (Relógio, Status do Sistema, Menu Rico)

- O painel do operador ganhou sidebar com navegação, relógio local de Maputo atualizado por segundo, estado da API/base de dados/SMS, perfil demonstrativo e saída para a página inicial.
- As secções sem rota funcional aparecem como preparadas e desativadas; a navegação existente e o mapa não foram alterados. A sidebar adapta cores e transparência aos temas claro e escuro.
- O botão **Dados de demonstração** ativa contadores e reportes fictícios apenas no frontend: 42 pessoas, 3 alertas ativos, 18 confirmações e três reportes de exemplo. Uma faixa informa que estes valores não vêm nem são gravados na Supabase. Desativando o modo, o painel volta aos dados reais da API.
- A área XGBoost permite expandir e inspecionar o payload de demonstração enviado ao modelo. A previsão continua a depender da API Python; se estiver desligada, o painel mostra instruções e não inventa uma classificação.

## UI/UX: Refinamento Institucional (Glassmorphism, Hero Section com Imagem Histórica, Trust Signals)

- A tela de entrada recebeu fundo azul profundo com gradientes radiais e padrão topográfico local em baixa opacidade, logótipo circular, identificação textual de INGD/INAM/ARA-Centro e título com gradiente.
- Os cartões de acesso usam vidro fosco, badges de acesso e realce no hover; as setas deslocam-se suavemente e as secções entram com animação curta.
- A tela comunitária apresenta data e estado no cabeçalho, fotografia histórica na coluna de introdução, formulário elevado com campos de foco visível e sinais de confiança com ícones Lucide.
- O cartão histórico mantém-se também no painel após registo; não foram alteradas as rotas nem chamadas de API.

## UI/UX: Implementação de Responsividade Mobile-First (Sidebar retrátil, Grids adaptativos, Touch targets otimizados)

- A tela de entrada empilha os cartões em mobile e usa duas colunas a partir de `sm`; o título usa tamanho fluido para caber em ecrãs estreitos.
- A tela da comunidade empilha introdução, fotografia histórica e formulário até `md`, passando a duas colunas em ecrãs maiores. Campos e botão mantêm alvos de toque com pelo menos 48 px e tipografia legível.
- No operador, a sidebar torna-se uma gaveta com hambúrguer e fundo de fecho até `md`; em desktop continua fixa. Estatísticas e mapa/análise adaptam as colunas conforme a largura.
- O mapa mantém pelo menos 300 px de altura em mobile; reportes podem quebrar em linhas sem criar scroll horizontal.
- Rotas, regras de negócio, cores, fontes e chamadas de API foram mantidas.

## UI/UX: Implementação de Carrossel Automático na Memória Histórica e Refinamento do Cartão de Risco da Comunidade

- O cartão histórico passou a alternar imagens locais de cheias e ciclones a cada 6 segundos, com crossfade, texto fixo, pontos indicadores e controlos manuais.
- O temporizador é limpo quando o componente sai da tela, evitando intervalos pendurados; setas e pontos permitem navegação acessível no telemóvel.
- O cartão de risco indisponível tem gradiente suave, borda tracejada e radar animado. Para risco baixo, médio ou alto, usa borda lateral e fundo com tonalidade correspondente.
- O cabeçalho comunitário permanece fixo durante o scroll; a localização aparece como filtro visual e o conteúdo da tela entra com uma animação discreta.
- As leituras de risco e os pedidos existentes à API não foram alterados.

## Fluxo C: Reporte comunitário e retorno ao painel do operador

- A tela da comunidade mantém o modal de reporte e agora apresenta as opções “Estrada cortada”, “Casa inundada” e “Pessoas isoladas”, com campo de descrição limitado a 500 caracteres.
- O botão de abertura do modal destaca o reporte de campo em vermelho suave. O envio usa o cliente API existente (`POST /api/reportes`) e associa o registo ao utilizador e distrito da sessão comunitária.
- O painel já consome `GET /api/painel`; o cartão foi identificado como “Reportes Recentes do Terreno” e mostra distrito, tipo, descrição, contacto e tempo decorrido. Os endpoints existentes de criação e consulta foram preservados.

## Fluxo de Identificação Comunitária: Login por Telemóvel, Sessão Persistente (localStorage) e Registo com Nome Personalizado

- A tela da comunidade oferece acesso para utilizadores existentes pelo número de telemóvel e um formulário de registo com nome, telefone, distrito e comunidade.
- O backend devolve os dados de identificação e localização no endpoint `POST /api/login`; o registo guarda ou actualiza o nome e inicia a identificação automaticamente.
- A identificação comunitária fica guardada no `localStorage` deste dispositivo, restaura a zona ao reabrir `/comunidade` e pode ser terminada em “Sair / Mudar de conta”.
- Foi adicionada a migração `backend/migrations/2026-11-19-add-community-user-name.sql`; executa-a no SQL Editor do Supabase antes de publicar a nova versão do backend.
- A identificação por telefone sem código de confirmação não comprova a posse do número; é uma sessão leve adequada ao protótipo, não autenticação forte.
## Segurança: Implementação de Autenticação de Operadores CENOE, Ecrã de Login (T06) e Proteção de Rotas com React Router

- A rota `/operador` agora exige uma sessão local válida e redireciona visitantes para `/operador/login`; a tela T06 oferece login, criação de operador e preenchimento de credenciais de demonstração.
- O backend possui endpoints de registo e login de operadores. As senhas são guardadas como hashes scrypt com salt individual e comparadas em tempo constante; nenhuma senha em texto simples é persistida.
- A sidebar apresenta o operador autenticado e encerra a sessão ao limpar `operador_sessao`. O painel mantém mapa, classificação e fluxo de alertas existentes.
- A migração `backend/migrations/2026-11-19-operator-auth.sql` adiciona os campos de autenticação e semeia uma conta fictícia para demonstração (`admin@cenoe.gov.mz` / `123456`). Remover ou substituir esta conta antes de qualquer uso operacional.
- A migração converte uma senha de demonstração legada para scrypt; outras senhas legadas são convertidas no primeiro login válido.
- A proteção de rota e o token `autorizado` são apenas uma barreira de interface para o protótipo. Antes de operação real, implementar sessão assinada no servidor, proteger as rotas de escrita da API e restringir/administrar a criação de operadores.