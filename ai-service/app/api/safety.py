from dataclasses import asdict
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.safety import pipeline

router = APIRouter()


class SafetyRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: Optional[List[str]] = Field(default=None, max_length=10)


@router.post("/safety/analyze")
def analyze(req: SafetyRequest):
    result = pipeline.analyze(req.message, req.context)
    return {
        "riskLevel": result.risk_level,
        "triggerType": result.trigger_type,
        "action": result.action,
        "showCrisisResources": result.show_crisis_resources,
        "helplines": result.helplines,
    }
