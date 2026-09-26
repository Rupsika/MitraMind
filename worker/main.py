"""Redis-backed background worker.

Protocol: producers LPUSH a JSON job {"type": str, "payload": {...}} onto the
queue list; this worker BRPOPs and dispatches to a handler in workers/.
Job payloads must not contain conversation text or audio.
"""
import json
import logging
import os
import signal
import sys
import time

import redis

from workers import HANDLERS

QUEUE = os.getenv("WORKER_QUEUE", "mitramind:jobs")
FAILED = f"{QUEUE}:failed"
MAX_ATTEMPTS = 3

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("mitramind.worker")
_running = True


def _stop(*_):
    global _running
    _running = False


def process(client: redis.Redis, raw: bytes | str) -> None:
    try:
        job = json.loads(raw)
        handler = HANDLERS[job["type"]]
    except (ValueError, KeyError, TypeError):
        log.info(json.dumps({"event": "job_rejected"}))
        client.lpush(FAILED, raw)
        return

    start = time.perf_counter()
    try:
        handler(job.get("payload") or {})
        log.info(json.dumps({"event": "job_done", "type": job["type"], "latencyMs": round((time.perf_counter() - start) * 1000)}))
    except Exception as exc:  # noqa: BLE001 - log the class only, never payloads
        attempts = int(job.get("attempts", 0)) + 1
        log.info(json.dumps({"event": "job_failed", "type": job["type"], "attempt": attempts, "error": type(exc).__name__}))
        if attempts < MAX_ATTEMPTS:
            job["attempts"] = attempts
            client.lpush(QUEUE, json.dumps(job))
        else:
            client.lpush(FAILED, raw)


def main() -> int:
    url = os.getenv("REDIS_URL")
    if not url:
        log.info(json.dumps({"event": "no_redis_url"}))
        return 1
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    client = redis.Redis.from_url(url)
    log.info(json.dumps({"event": "worker_started", "queue": QUEUE}))
    while _running:
        try:
            item = client.brpop(QUEUE, timeout=5)
        except redis.RedisError:
            log.info(json.dumps({"event": "redis_unavailable"}))
            time.sleep(3)
            continue
        if item:
            process(client, item[1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
