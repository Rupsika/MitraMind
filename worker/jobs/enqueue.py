"""Enqueue a job from the command line, e.g.:  python jobs/enqueue.py reindex_knowledge_base"""
import json
import os
import sys

import redis


def enqueue(job_type: str, payload: dict | None = None) -> None:
    client = redis.Redis.from_url(os.environ["REDIS_URL"])
    client.lpush(os.getenv("WORKER_QUEUE", "mitramind:jobs"), json.dumps({"type": job_type, "payload": payload or {}}))


if __name__ == "__main__":
    enqueue(sys.argv[1])
    print(f"enqueued {sys.argv[1]}")
