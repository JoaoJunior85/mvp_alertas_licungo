# Preparar a hospedagem

O repositório tem Docker Compose para iniciar frontend, backend Node e API FastAPI/XGBoost numa máquina própria. Para obter URLs gratuitas para a apresentação, a arquitectura recomendada é frontend estático no Vercel e os serviços Node e Python no Render. A base de dados continua no Supabase.

## Requisitos

- Para executar localmente com containers: Docker Engine e Docker Compose v2.
- Uma base PostgreSQL/Supabase acessível pelo backend.
- O schema/tabelas do projecto aplicados nessa base de dados.
- Para construir a API do modelo, os ficheiros versionados em `deployment/risk-model/model`: `api.py`, `flood_model.pkl`, `encoders.pkl` e `feature_columns.pkl`. O submódulo `api-risco` mantém a origem do modelo, mas não é necessário durante o build no Render.

## Preparar as variáveis

1. Copiar `backend/.env.example` para `backend/.env`.
2. Preencher `DATABASE_URL` com a connection string PostgreSQL do Supabase.
3. Definir `CORS_ORIGIN` para a origem pública do painel, por exemplo `https://alertas.exemplo.org`, sem barra no fim. Para teste local, usar `http://localhost:8080`.
4. Manter `SMS_API_KEY` vazio para conservar a simulação de SMS. As chamadas simuladas aparecem nos logs do backend.
5. Se o mapa usar uma chave Carto, definir `VITE_CARTO_API_KEY` no ambiente usado ao construir o frontend. Esta chave é entregue ao browser; restringir a chave no fornecedor.

O ficheiro `backend/.env` contém credenciais e não deve ser enviado ao Git. O `RISK_MODEL_API_URL` configurado pelo Compose aponta para `http://risk-model:8000`; não usar `localhost` entre containers.

## Construir e iniciar

Na raiz do repositório:

```powershell
docker compose up --build -d
docker compose ps
```

Abrir `http://localhost:8080`. O Compose aguarda a API Python ficar saudável antes de iniciar o backend e aguarda o backend e a base de dados antes de iniciar o frontend.

Ver logs:

```powershell
docker compose logs -f risk-model backend frontend
```

Parar os containers sem apagar a base externa:

```powershell
docker compose down
```

## Publicação num servidor

Configurar DNS e TLS no proxy/serviço de hospedagem e apontar o domínio para a porta 8080 do frontend. Actualizar `CORS_ORIGIN` para esse domínio e reconstruir os serviços:

```powershell
docker compose up --build -d
```

Não publicar as portas 3000 e 8000 directamente na Internet. Usar as rotas `/api/...` pelo Nginx. O health check do frontend está disponível em `/health` e confirma a ligação à base de dados pelo backend.

## Estado e limitações

- A API do modelo fica privada na rede Docker e é chamada pelo backend através do nome `risk-model`.
- Sem `SMS_API_KEY`, o envio de SMS continua simulado; o Compose não activa nenhum fornecedor.
- A previsão XGBoost ainda usa os valores demonstrativos do painel. Hospedar os containers não transforma esses valores em dados observados nem valida a precisão do modelo.
- O artefacto XGBoost em pickle apresentou um aviso de serialização de versão durante a execução local. O container fixa scikit-learn em 1.6.1 para corresponder ao `LabelEncoder` guardado; antes de uso operacional, recuperar também a versão exacta de XGBoost usada no treino e validar o artefacto.
- Esta configuração prepara uma implantação Docker numa máquina/host que aceite containers; não cria uma conta nem publica o sistema num fornecedor externo.
- O protótipo ainda não tem autenticação de operadores. Restringir o acesso por rede enquanto for uma demonstração; não o expor para operação pública com dados comunitários até implementar autenticação e autorização.

## Credencial da base de dados

O antigo exemplo de ambiente continha uma credencial PostgreSQL. Foi removida de `backend/.env.example` e substituída por um placeholder. Trocar a senha correspondente no Supabase antes de publicar e actualizar apenas o ficheiro local `backend/.env`.

## Publicar passo a passo: Supabase → Render → Vercel

A aplicação publica-se em três partes: Supabase mantém a base existente, Render executa Node e a API Python, e Vercel publica o frontend React. O `render.yaml` já descreve os dois serviços Render; `frontend/vercel.json` contém o fallback das rotas React.

### 1. Preparar e enviar o repositório ao GitHub

1. Confirma que estás na branch `main` e que o `origin` aponta para o repositório GitHub correcto.
2. A imagem do modelo usa uma cópia versionada e autónoma em `deployment/risk-model/model`; o build no Render não depende de clonar o submódulo `api-risco`. O submódulo continua a servir de referência para a origem do código e dos artefactos. Quando o modelo for actualizado, copia os quatro ficheiros dessa origem para a pasta versionada antes de publicar.

   ```powershell
   Get-ChildItem deployment/risk-model/model
   git status --short
   ```

   Confirma que aparecem os quatro ficheiros; não adiciones `.venv`, `venv` nem ficheiros `.env` ao Git.

3. Confirma `git status` e verifica que nenhum `.env` ou segredo aparece para commit. Depois adiciona e publica as alterações necessárias:

   ```powershell
   git add -A
   git status
   git commit -m "Preparar publicação do sistema de alerta"
   git push origin main
   ```

   Este passo é obrigatório: Vercel e Render fazem deploy do GitHub, não dos ficheiros ainda não enviados do teu computador.

   O commit deve incluir o Dockerfile actualizado e os quatro ficheiros em `deployment/risk-model/model`.

### 2. Confirmar a Supabase

1. Mantém o projecto Supabase e as tabelas actuais; não executes scripts de criação ou limpeza se a base já contém os dados necessários.
2. A palavra-passe antiga da base foi exposta num exemplo de configuração. Redefine-a nas definições da base Supabase antes de publicar.
3. No painel Supabase, abre **Connect** e copia a connection string de **Session pooler**. O Render deve usar uma ligação IPv4 compatível; o Session pooler usa a porta `5432`. Substitui o placeholder da palavra-passe e codifica caracteres especiais, se necessário. Acrescenta `?sslmode=require` se ainda não estiver presente. [Ligação PostgreSQL Supabase e modos de conexão](https://supabase.com/docs/guides/database/connecting-to-postgres) · [pooling e limites](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits).

Guarda esta string para introduzir como `DATABASE_URL` no Render. **Não a coloques no frontend, no GitHub, em `VITE_*`, nem aqui no chat.**

### 3. Criar os serviços no Render

1. Entra no [Render Dashboard](https://dashboard.render.com), escolhe **New → Blueprint** e liga o repositório GitHub enviado no passo 1, branch `main`.
2. Confirma que a revisão do Blueprint mostra dois serviços `licungo-risk-model` e `licungo-backend`, ambos no plano Free, e selecciona **Deploy Blueprint**. O Render lê o `render.yaml` da raiz e cria os recursos descritos. [Criar um Render Blueprint](https://render.com/docs/infrastructure-as-code) · [referência do Blueprint](https://render.com/docs/blueprint-spec).
3. Quando o formulário pedir valores para `sync: false`, preenche:

   | Serviço | Variável | Valor |
   |---|---|---|
   | `licungo-backend` | `DATABASE_URL` | Connection string Session pooler da Supabase, com password actual e SSL |
   | `licungo-backend` | `RISK_MODEL_API_URL` | URL pública do serviço `licungo-risk-model`, por exemplo `https://licungo-risk-model.onrender.com` |
   | `licungo-backend` | `CORS_ORIGIN` | URL Vercel prevista, por exemplo `https://licungo-alerta.vercel.app`, sem `/` final |

   O nome público real pode receber sufixo se já existir. Confirma-o na página do serviço Python. Se for diferente do valor introduzido, actualiza `RISK_MODEL_API_URL` nas variáveis do serviço Node e faz **Manual Deploy → Deploy latest commit**.

4. O Blueprint gera `MODEL_API_TOKEN` e partilha-o entre o modelo e o backend. Não o copies para o Vercel.
5. Mantém `SMS_API_KEY` ausente/vazio para os SMS continuarem simulados. Não introduzas uma chave real do fornecedor.
6. Espera pelos dois deploys. Confirma no browser:
   - `https://<modelo>.onrender.com/health` responde com estado saudável;
   - `https://<backend>.onrender.com/health` responde `status: ok` e `database: ok`.

### 4. Publicar o frontend no Vercel

1. Entra no [Vercel Dashboard](https://vercel.com/dashboard), escolhe **Add New → Project** e importa o mesmo repositório GitHub.
2. Define **Root Directory** como `frontend`. O Vercel deve detectar Vite. Configura build `npm run build` e output `dist` (normalmente detectados automaticamente).
3. Em **Environment Variables**, adiciona `VITE_API_URL` com `https://<backend>.onrender.com/api`. A variável é incluída no build do Vite, portanto não coloques segredos neste valor. Se o mapa precisar de uma chave Carto, `VITE_CARTO_API_KEY` é opcional.
4. Selecciona **Deploy** e espera pelo URL `*.vercel.app`. O plano Hobby é destinado a uso pessoal e não comercial; confirma a elegibilidade do projecto académico nos termos actuais. [Vite no Vercel](https://vercel.com/docs/frameworks/frontend/vite) · [plano Hobby](https://vercel.com/docs/plans/hobby).

### 5. Ligar CORS e validar o site

1. Com o URL final do frontend, abre no Render o serviço `licungo-backend` → **Environment** e define `CORS_ORIGIN` exactamente como `https://<frontend>.vercel.app`, sem barra no fim.
2. Faz **Manual Deploy → Deploy latest commit** no backend. Alterações de variáveis só entram em vigor depois de um novo deploy. [Variáveis no Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).
3. Abre o URL Vercel e verifica `/`, `/comunidade` e `/operador`. Confirma que o operador carrega distritos e que o teste XGBoost produz uma classificação. O frontend usa os valores de demonstração já identificados; isso não cria medições reais na Supabase.
4. Antes da apresentação, abre uma vez `/health` do modelo e do backend. Os serviços gratuitos do Render suspendem após 15 minutos sem tráfego e podem levar cerca de um minuto para acordar. [Limitações do Render Free](https://render.com/docs/free).

### Segurança e limitações da apresentação

- Usa dados demonstrativos e números de telefone fictícios; mantém `SMS_API_KEY` vazio. O protótipo ainda não tem autenticação de operadores e as rotas de escrita ficam públicas quando publicadas. Não uses dados pessoais reais nem apresentes o URL como serviço operacional oficial.
- O endpoint `/predict` do modelo usa o token entre os dois serviços Render. CORS limita origens do browser, mas não substitui autenticação nas rotas de escrita.
- O plano gratuito do Render dorme após 15 minutos; o primeiro acesso pode ser lento. O Vercel Hobby é gratuito dentro dos seus limites e apenas para uso pessoal/não comercial.
- A inferência XGBoost mostra funcionamento técnico com valores demonstrativos. Não valida precisão científica nem o risco actual de um distrito.
