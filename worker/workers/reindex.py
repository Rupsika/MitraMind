import os

import requests

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000")


def handle_reindex(_payload: dict) -> None:
    """Ask the AI service to rebuild its FAISS index from the knowledge base."""
    resp = requests.post(
        f"{AI_SERVICE_URL}/ai/admin/reindex",
        headers={"x-internal-token": os.getenv("INTERNAL_API_TOKEN", "")},
        timeout=600,
    )
    resp.raise_for_status()
