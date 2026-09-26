from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app import config
from app.voice.audio_utils import validate_audio
from app.voice.sarvam_client import is_voice_configured, synthesize_speech, transcribe_audio

router = APIRouter()

MAX_AUDIO_BYTES = 10 * 1024 * 1024


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2500)
    language: Literal["en", "hi", "te", "ta"] = "en"


def _require_voice():
    if not is_voice_configured():
        raise HTTPException(status_code=503, detail="Voice service is not configured.")


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: Literal["en", "hi", "te", "ta"] = Form("en")):
    _require_voice()
    audio = await file.read()
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio too large.")
    if not validate_audio(audio):
        raise HTTPException(status_code=400, detail="Audio is empty or too short.")
    try:
        text = transcribe_audio(audio, config.sarvam_language(language, "asr"))
    except Exception:
        raise HTTPException(status_code=502, detail="Transcription failed.")
    return {"text": text, "language": language}


@router.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    _require_voice()
    try:
        audio = synthesize_speech(req.text, config.sarvam_language(req.language, "tts"))
    except Exception:
        raise HTTPException(status_code=502, detail="Speech synthesis failed.")
    return Response(content=audio, media_type="audio/wav")
