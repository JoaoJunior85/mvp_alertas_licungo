# Artefactos da API de risco

Esta pasta contém a cópia versionada que o Docker/Render usa para construir a API do modelo.

- `api.py`: API FastAPI e preparação das features.
- `flood_model.pkl`: modelo XGBoost treinado.
- `encoders.pkl` e `feature_columns.pkl`: artefactos auxiliares do modelo.

A origem de trabalho continua no submódulo `api-risco/api-py`. Ao actualizar o modelo, sincroniza estes quatro ficheiros e publica-os no mesmo commit do Dockerfile. Não copies ambientes virtuais nem credenciais para esta pasta.
