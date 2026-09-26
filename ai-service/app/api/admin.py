import hmac
import os

from fastapi import APIRouter, Header, HTTPException

from app.api import chat
from app.rag.ingest import build_vector_store

router = APIRouter()


def _check_token(token: str | None) -> None:
    expected = os.getenv("INTERNAL_API_TOKEN")
    # Disabled unless a token is configured; compare in constant time.
    if not expected or not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/admin/reindex")
def reindex(x_internal_token: str | None = Header(default=None)):
    """Rebuild the FAISS index from knowledge-base/documents. Called by the worker."""
    _check_token(x_internal_token)
    ok = build_vector_store()
    chat.get_rag.cache_clear()  # reload the new index on next chat request
    if not ok:
        raise HTTPException(status_code=422, detail="No documents were indexed.")
    return {"status": "reindexed"}
