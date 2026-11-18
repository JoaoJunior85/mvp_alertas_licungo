"""Applies service-to-service authentication around the upstream FastAPI app."""
import os

from fastapi import Request
from fastapi.responses import JSONResponse

from api import app

MODEL_API_TOKEN = os.getenv("MODEL_API_TOKEN")
REQUIRE_TOKEN = os.getenv("REQUIRE_MODEL_API_TOKEN", "false").lower() == "true"

if REQUIRE_TOKEN and not MODEL_API_TOKEN:
    raise RuntimeError("MODEL_API_TOKEN is required for this hosted model service.")


@app.middleware("http")
async def protect_prediction(request: Request, call_next):
    """Require the Node backend token for predictions, leaving health public."""
    if request.method == "POST" and request.url.path == "/predict" and MODEL_API_TOKEN:
        if request.headers.get("authorization") != f"Bearer {MODEL_API_TOKEN}":
            return JSONResponse(status_code=401, content={"detail": "Credencial do serviço inválida."})
    return await call_next(request)
