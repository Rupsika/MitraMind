import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
APP_DIR = Path(__file__).resolve().parent
SERVICE_DIR = APP_DIR.parent
REPO_ROOT = SERVICE_DIR.parent

# Load environment variables (repo-root .env first, then service-local override)
load_dotenv(REPO_ROOT / ".env")
load_dotenv(SERVICE_DIR / ".env", override=True)

DATA_DIR = SERVICE_DIR / "data"
KNOWLEDGE_BASE_DIR = Path(os.getenv("KNOWLEDGE_BASE_DIR", REPO_ROOT / "knowledge-base" / "documents"))
FAISS_INDEX_DIR = Path(os.getenv("FAISS_INDEX_DIR", DATA_DIR / "faiss_index"))

DATA_DIR.mkdir(exist_ok=True)
FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)

# LLM and Embeddings Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "google").lower()  # "google" or "openai"

# API Keys (GEMINI_API_KEY is accepted as an alias of GOOGLE_API_KEY)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# RAG Splitter Parameters
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
RETRIEVAL_K = 3

# Sarvam AI API Configurations
SARVAM_ASR_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Unified speaker name for Bulbul v3 TTS model
SARVAM_TTS_SPEAKER = "ritu"

# Language Mapping: Display Name -> Language Details
# We support English, Hindi, Telugu, Tamil
LANGUAGES = {
    "English": {"code": "en-IN", "sarvam_asr_lang": "en-IN", "sarvam_tts_lang": "en-IN"},
    "Hindi (हिन्दी)": {"code": "hi-IN", "sarvam_asr_lang": "hi-IN", "sarvam_tts_lang": "hi-IN"},
    "Telugu (తెలుగు)": {"code": "te-IN", "sarvam_asr_lang": "te-IN", "sarvam_tts_lang": "te-IN"},
    "Tamil (தமிழ்)": {"code": "ta-IN", "sarvam_asr_lang": "ta-IN", "sarvam_tts_lang": "ta-IN"},
}

# Short API code (as sent by the Node backend / frontend) -> display name used in prompts
LANGUAGE_CODES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "te": "Telugu (తెలుగు)",
    "ta": "Tamil (தமிழ்)",
}


def language_name(code: str) -> str:
    return LANGUAGE_CODES.get((code or "en").lower()[:2], "English")


def sarvam_language(code: str, kind: str = "asr") -> str:
    info = LANGUAGES[language_name(code)]
    return info[f"sarvam_{kind}_lang"]


# Crisis keywords retained for the legacy RAG check. The safety pipeline
# (app/safety) is the authoritative classifier.
CRISIS_KEYWORDS = {
    "suicide", "kill myself", "end my life",
    "आत्महत्या", "जान देना",
    "ఆత్మహత్య", "చనిపోవాలి",
    "தற்கொலை", "சாக வேண்டும்",
}

# Verified helpline details, taken from the curated knowledge base. The LLM
# must never generate helpline numbers; these are shown verbatim.
HELPLINES = {
    "title": "Emergency mental health helplines (India)",
    "message": (
        "If you are in distress or having thoughts of self-harm, you are not alone. "
        "Please reach out to one of these support channels, or to someone you trust:"
    ),
    "numbers": [
        {"name": "Kiran (Govt. of India)", "number": "1800-599-0019", "availability": "24/7, toll-free"},
        {"name": "Tele-MANAS (Govt. of India)", "number": "14416 or 1800-891-4416", "availability": "24/7, toll-free"},
        {"name": "Vandrevala Foundation", "number": "+91 9999 666 555", "availability": "24/7"},
        {"name": "AASRA", "number": "+91 98204 66726", "availability": "24/7"},
        {"name": "iCall (TISS)", "number": "+91 91529 87821", "availability": "Mon-Sat, 10 AM - 8 PM"},
        {"name": "Sneha India", "number": "+91 44 24640050", "availability": "24/7, English & Tamil"},
    ],
}
