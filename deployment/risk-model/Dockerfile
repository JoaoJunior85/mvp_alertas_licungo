FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install --no-install-recommends -y libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY deployment/risk-model/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY api-risco/api-py/api.py ./
COPY api-risco/api-py/flood_model.pkl ./
COPY api-risco/api-py/encoders.pkl ./
COPY api-risco/api-py/feature_columns.pkl ./
COPY deployment/risk-model/entrypoint.py ./
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn entrypoint:app --host 0.0.0.0 --port ${PORT:-8000}"]
