import logging
import time
import uuid

from fastapi import FastAPI, Request

from app.api import admin, chat, health, safety, voice

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("mitramind.ai")

app = FastAPI(title="MitraMind AI Service", version="0.1.0")


@app.middleware("http")
async def structured_log(request: Request, call_next):
    """Log request metadata only, never message bodies or audio."""
    request_id = request.headers.get("x-request-id", uuid.uuid4().hex[:12])
    start = time.perf_counter()
    response = await call_next(request)
    latency_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        '{"requestId": "%s", "endpoint": "%s", "status": %d, "latencyMs": %d}',
        request_id, request.url.path, response.status_code, latency_ms,
    )
    response.headers["x-request-id"] = request_id
    return response


app.include_router(health.router)
app.include_router(chat.router, prefix="/ai")
app.include_router(voice.router, prefix="/ai")
app.include_router(safety.router, prefix="/ai")
app.include_router(admin.router, prefix="/ai")
