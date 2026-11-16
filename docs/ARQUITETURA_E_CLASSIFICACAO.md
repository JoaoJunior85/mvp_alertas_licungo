# Arquitetura e classificação de risco

Este guia descreve como o protótipo está organizado e como o risco é calculado. O motor atual é um **conjunto determinístico de regras ponderadas**. Não é um modelo de machine learning e não aprende com dados históricos.

## Como o projeto está organizado

```text
backend/
  src/
    config/db.js             ligação partilhada ao PostgreSQL
    server.js                rotas HTTP e validação dos dados recebidos
    services/risk.js         regras puras de classificação
    services/risk.test.js    testes unitários das regras
frontend/src/
  App.jsx                    rotas e composição das telas
  api.js                     pedidos HTTP ao backend
  components/                telas e componentes reutilizáveis
  constants/risk.js          nomes, cores e mensagens por nível de risco
  utils/dateLabel.js         apresentação de datas
```

O backend lê as medições, valida valores e timestamps e chama `calcularClassificacao`. A função em `backend/src/services/risk.js` recebe apenas valores; não conhece HTTP, React nem banco de dados. Essa separação permite testar a fórmula sem iniciar a aplicação ou ligar ao PostgreSQL.

## Mapa dos ficheiros de código

| Ficheiro | Responsabilidade |
|---|---|
| `backend/src/config/db.js` | Lê `DATABASE_URL`, cria o pool PostgreSQL e verifica a ligação ao iniciar. |
| `backend/src/server.js` | Cria o Express, consulta e altera dados, valida a atualidade do risco e expõe as rotas HTTP. |
| `backend/src/services/risk.js` | Converte indicadores em score e nível; contém a regra pura, sem dependência da API. |
| `backend/src/services/risk.test.js` | Testa as regras do classificador com o runner de testes nativo do Node. |
| `backend/package.json` | Dependências e comandos do servidor e dos testes. |
| `frontend/src/main.jsx` | Ponto de entrada React; monta `App` e importa o CSS global. |
| `frontend/src/App.jsx` | Define as rotas `/`, `/operador` e `/comunidade`. |
| `frontend/src/api.js` | Funções de consulta e escrita HTTP usadas pelas telas; traduz respostas HTTP em erros JavaScript. |
| `frontend/src/components/EntryScreen.jsx` | Página inicial com acesso às experiências de operador e comunidade. |
| `frontend/src/components/OperatorScreen.jsx` | Painel do operador: carrega indicadores, pede análise, permite ajuste justificado e emite alertas. |
| `frontend/src/components/CommunityScreen.jsx` | Registo comunitário, consulta de avisos, confirmação de receção e envio de reporte. |
| `frontend/src/components/RiskMap.jsx` | Mapa Leaflet; usa coordenadas dos distritos e metadados de risco para colorir os marcadores. |
| `frontend/src/components/Brand.jsx` | Marca reutilizável, com o mesmo link para a página inicial. |
| `frontend/src/components/CartaoMemoriaHistorica.jsx` | Cartão educativo de memória histórica apresentado à comunidade. |
| `frontend/src/components/ContextoHistoricoCritico.jsx` | Aviso visual complementar mostrado para classificação alta. |
| `frontend/src/constants/risk.js` | Rótulos, recomendações e cores de interface; não decide o score. |
| `frontend/src/utils/dateLabel.js` | Formata datas para apresentação em `pt-MZ`. |
| `frontend/src/index.css` | Estilos globais, temas, componentes e responsividade. |
| `frontend/src/App.css` | Estilos que restaram do template Vite; a aplicação usa principalmente `index.css`. |
| `frontend/vite.config.js` | Configura plugins React e Tailwind no Vite. |
| `frontend/tailwind.config.js` | Tokens de cor, tipografia e animações usados pelas classes utilitárias. |
| `frontend/index.html` | Documento HTML anfitrião carregado pelo Vite. |
| `frontend/package.json` | Dependências e comandos do frontend: servidor, build, preview e lint. |

Os ficheiros `package-lock.json` registam versões exatas das dependências; como são JSON, não aceitam comentários. Imagens e ícones em `frontend/img`, `frontend/public` e `frontend/src/assets` são recursos estáticos, não módulos executáveis.

## Entradas e validação

`calcularClassificacao({ nivel, atencao, emergencia, chuva, ciclone })` recebe:

- `nivel`: nível observado do rio, em metros e não negativo;
- `atencao` e `emergencia`: cotas não negativas da estação, na mesma unidade, com emergência acima da atenção;
- `chuva`: precipitação prevista para 24 horas, em milímetros, maior ou igual a zero;
- `ciclone`: estado textual não vazio. Textos contendo “nenhum”, “normal” ou “sem” indicam ausência de ciclone.

A rota `GET /api/risco/:distritoId`, em `backend/src/server.js`, obtém a leitura mais recente do rio e a previsão meteorológica. Exige que ambas existam e sejam recentes: rio até 6 horas e meteorologia até 24 horas. Rejeita datas futuras e valores ausentes. Se qualquer requisito falhar, a API devolve `nivel: "indisponivel"`, `score: null` e `dados_disponiveis: false`. Nesse resultado não se deve interpretar “indisponível” como risco baixo.

## Fórmula passo a passo

### 1. Componente do rio

O nível é comparado às cotas da estação:

- Abaixo da cota de atenção: `rio = 50 × nivel / atencao` (limitado naturalmente pelo intervalo até à cota).
- Da cota de atenção até à emergência: `rio = 50 + 50 × (nivel − atencao) / (emergencia − atencao)`.
- Na emergência ou acima: `rio = 100`.

Assim, a cota de atenção corresponde a 50 pontos do componente do rio e a emergência corresponde a 100.

### 2. Componente da chuva

`chuvaScore = limitar(chuva / 120 × 100, entre 0 e 100)`.

Por exemplo, 60 mm resultam em 50 pontos; 120 mm ou mais resultam em 100. Os 120 mm são um parâmetro provisório do protótipo, não um limiar oficial.

### 3. Componente do ciclone

O componente é binário: estados contendo “nenhum”, “normal” ou “sem” valem 0; qualquer outro texto preenchido vale 100. Isto pressupõe que o texto recebido foi validado pela fonte. Uma descrição desconhecida também será tratada como ciclone presente, pelo que a normalização dos estados da fonte é importante.

### 4. Score e nível

`score ponderado = arredondar(rio × 0,50 + chuvaScore × 0,30 + cicloneScore × 0,20)`.

Os pesos somam 100%. O score é uma pontuação heurística de 0 a 100, não uma probabilidade. Os níveis usados são:

| Score | Nível |
|---:|---|
| 0–29 | Baixo |
| 30–64 | Médio |
| 65–100 | Alto |

### Exceção para ciclone severo

Como o ciclone tem peso de 20%, um alerta de ciclone isolado só obteria 20 no score ponderado. Para não ocultar um aviso grave, quando o texto contém “vermelho”, “severo” ou “intenso”, o score final passa a ser pelo menos 65. O detalhe do componente continua em 100; o score final é elevado para o limiar alto, se necessário. Esta exceção é uma decisão de segurança do protótipo e deve ser validada com especialistas e com os estados realmente fornecidos pelo INAM.

## Exemplos com os parâmetros dos testes

Os casos seguintes são didáticos e usam as cotas de teste `atenção = 10 m` e `emergência = 20 m`. Não são dados oficiais.

1. **Cheia:** nível 20 m, chuva 120 mm, ciclone “Nenhum”. Rio 100, chuva 100, ciclone 0; score `100×0,5 + 100×0,3 = 80`, portanto alto.
2. **Ciclone vermelho:** nível 5 m, atenção 10 m, chuva 0 mm, ciclone “Alerta vermelho”. Rio 25, chuva 0, ciclone 100; score ponderado 33? Na fórmula: `25×0,5 + 0×0,3 + 100×0,2 = 32,5`, arredondado para 33. A exceção aplica o mínimo de 65, portanto alto.
3. **Intermédio:** nível 8 m, chuva 80 mm e sem ciclone. Rio 40, chuva aproximadamente 67, ciclone 0; score `20 + 20 = 40`, portanto médio.
4. **Cotas recebidas como texto:** valores como `"2"` e `"10"` são convertidos para números antes da comparação, evitando comparar texto por ordem alfabética.

## Onde a classificação aparece

- `backend/src/services/risk.js`: fórmula, validação numérica, limiares e exceção do ciclone severo.
- `backend/src/server.js`: consulta à base, validação de idade dos dados e formato da resposta HTTP.
- `backend/src/services/risk.test.js`: exemplos automatizados das regras puras; executar com `npm test` dentro de `backend/`.
- `frontend/src/constants/risk.js`: rótulos, cores e recomendações que a interface associa ao nível recebido.
- `frontend/src/components/OperatorScreen.jsx`: análise, validação manual e pedido para emitir o alerta.

## Limitações a ter em conta

- Os pesos, os cortes de 30/65 e os 120 mm são parâmetros do protótipo, ainda sem calibração com especialistas ou séries históricas locais.
- A rota trata um valor de ciclone preenchido e não reconhecido como ciclone presente; os estados precisam de uma lista controlada e normalizada.
- Testes unitários validam a fórmula, mas não substituem testes da API com banco de teste nem ensaios ponta a ponta.
- Este protótipo não substitui avisos oficiais do INAM, ARA-Centro ou INGD.
