import pytest
from fastapi.testclient import TestClient

from app.api import chat as chat_api
from app.main import app

client = TestClient(app)


class FakeRAG:
    def query(self, question, history, language="English"):
        return {
            "answer": f"answer in {language}",
            "sources": ["who.txt"],
            "sources_detail": [{"title": "who.txt", "page": None}],
            "crisis_triggered": False,
        }


@pytest.fixture(autouse=True)
def fake_rag(monkeypatch):
    monkeypatch.setattr(chat_api, "get_rag", lambda: FakeRAG())


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "mitramind-ai"}


def test_chat_normal_returns_sources():
    r = client.post("/ai/chat", json={"message": "How can stress be managed?", "language": "hi"}).json()
    assert r["riskLevel"] in ("NORMAL", "DISTRESS")
    assert r["sources"] == [{"title": "who.txt", "page": None}]
    assert "Hindi" in r["answer"]


def test_chat_crisis_bypasses_llm_and_returns_verified_helplines():
    r = client.post("/ai/chat", json={"message": "I want to kill myself", "language": "en"}).json()
    assert r["riskLevel"] == "CRISIS_SIGNAL"
    assert r["showCrisisResources"] is True
    assert "answer in" not in r["answer"]
    numbers = " ".join(h["number"] for h in r["helplines"]["numbers"])
    assert "1800-599-0019" in numbers and "14416" in numbers


def test_chat_high_concern_appends_support_note():
    r = client.post("/ai/chat", json={"message": "I feel completely hopeless", "language": "en"}).json()
    assert r["riskLevel"] == "HIGH_CONCERN"
    assert "counsellor" in r["answer"]


def test_chat_validates_input():
    assert client.post("/ai/chat", json={"message": "", "language": "en"}).status_code == 422
    assert client.post("/ai/chat", json={"message": "hi", "language": "fr"}).status_code == 422


def test_transcribe_requires_configuration(monkeypatch):
    from app.api import voice
    monkeypatch.setattr(voice, "is_voice_configured", lambda: False)
    r = client.post("/ai/transcribe", files={"file": ("a.wav", b"x" * 2000, "audio/wav")}, data={"language": "en"})
    assert r.status_code == 503


def test_transcribe_and_synthesize(monkeypatch):
    from app.api import voice
    monkeypatch.setattr(voice, "is_voice_configured", lambda: True)
    monkeypatch.setattr(voice, "transcribe_audio", lambda audio, lang: f"heard {lang}")
    monkeypatch.setattr(voice, "synthesize_speech", lambda text, lang: b"RIFFaudio")
    r = client.post("/ai/transcribe", files={"file": ("a.wav", b"x" * 2000, "audio/wav")}, data={"language": "te"})
    assert r.json() == {"text": "heard te-IN", "language": "te"}
    s = client.post("/ai/synthesize", json={"text": "hello", "language": "en"})
    assert s.content == b"RIFFaudio" and s.headers["content-type"] == "audio/wav"


def test_transcribe_rejects_tiny_audio(monkeypatch):
    from app.api import voice
    monkeypatch.setattr(voice, "is_voice_configured", lambda: True)
    r = client.post("/ai/transcribe", files={"file": ("a.wav", b"x", "audio/wav")}, data={"language": "en"})
    assert r.status_code == 400


def test_admin_reindex_requires_token(monkeypatch):
    monkeypatch.delenv("INTERNAL_API_TOKEN", raising=False)
    assert client.post("/ai/admin/reindex").status_code == 403
    monkeypatch.setenv("INTERNAL_API_TOKEN", "secret-token")
    assert client.post("/ai/admin/reindex", headers={"x-internal-token": "wrong"}).status_code == 403
