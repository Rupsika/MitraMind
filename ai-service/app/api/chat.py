from functools import lru_cache
from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.retriever import MitraRAG
from app.safety import pipeline
from app import config

router = APIRouter()


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Literal["en", "hi", "te", "ta"] = "en"
    conversation_id: Optional[str] = None
    history: List[HistoryItem] = Field(default_factory=list, max_length=20)


@lru_cache(maxsize=1)
def get_rag() -> MitraRAG:
    return MitraRAG()


def _history_pairs(history: List[HistoryItem]):
    """Convert a flat message list into the (user, assistant) tuples the RAG expects."""
    pairs, pending = [], None
    for item in history:
        if item.role == "user":
            pending = item.content
        elif pending is not None:
            pairs.append((pending, item.content))
            pending = None
    return pairs


@router.post("/chat")
def chat(req: ChatRequest):
    # 1. Safety screening always runs first and never depends on the LLM.
    prior_user_msgs = [h.content for h in req.history if h.role == "user"]
    safety = pipeline.analyze(req.message, prior_user_msgs)

    # 2. Crisis signals short-circuit generation: fixed supportive text + verified helplines.
    if safety.risk_level == "CRISIS_SIGNAL":
        return {
            "answer": pipeline.crisis_message(req.language),
            "language": req.language,
            "riskLevel": safety.risk_level,
            "triggerType": safety.trigger_type,
            "sources": [],
            "showCrisisResources": True,
            "helplines": config.HELPLINES,
        }

    # 3. Normal grounded generation (retrieval + Gemini).
    result = get_rag().query(
        question=req.message,
        history=_history_pairs(req.history),
        language=config.language_name(req.language),
    )
    answer = result["answer"]
    if safety.risk_level == "HIGH_CONCERN":
        answer = f"{answer}\n\n{pipeline.high_concern_note(req.language)}"

    return {
        "answer": answer,
        "language": req.language,
        "riskLevel": safety.risk_level,
        "triggerType": safety.trigger_type,
        "sources": result.get("sources_detail", []),
        "showCrisisResources": False,
        "helplines": safety.helplines,
    }
