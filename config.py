import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
KNOWLEDGE_BASE_DIR = DATA_DIR / "knowledge_base"
FAISS_INDEX_DIR = DATA_DIR / "faiss_index"
ASSETS_DIR = BASE_DIR / "assets"
STYLE_CSS_PATH = ASSETS_DIR / "style.css"

# Create directories if they do not exist
DATA_DIR.mkdir(exist_ok=True)
KNOWLEDGE_BASE_DIR.mkdir(exist_ok=True)
FAISS_INDEX_DIR.mkdir(exist_ok=True)
ASSETS_DIR.mkdir(exist_ok=True)

# LLM and Embeddings Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "google").lower()  # "google" or "openai"

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# RAG Splitter Parameters
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Sarvam AI API Configurations
SARVAM_ASR_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Unified speaker name for Bulbul v3 TTS model
SARVAM_TTS_SPEAKER = "ritu"

# Language Mapping: Display Name -> Language Details
# We support English, Hindi, Telugu, Tamil
LANGUAGES = {
    "English": {
        "code": "en-IN",
        "sarvam_asr_lang": "en-IN",
        "sarvam_tts_lang": "en-IN"
    },
    "Hindi (हिन्दी)": {
        "code": "hi-IN",
        "sarvam_asr_lang": "hi-IN",
        "sarvam_tts_lang": "hi-IN"
    },
    "Telugu (తెలుగు)": {
        "code": "te-IN",
        "sarvam_asr_lang": "te-IN",
        "sarvam_tts_lang": "te-IN"
    },
    "Tamil (தமிழ்)": {
        "code": "ta-IN",
        "sarvam_asr_lang": "ta-IN",
        "sarvam_tts_lang": "ta-IN"
    }
}

# Crisis keywords in different languages to trigger helpline details
CRISIS_KEYWORDS = {
    "suicide", "kill myself", "die", "end my life", "depression", "anxiety",
    "आत्महत्या", "मरना", "जान देना", "अवसाद", "चिंता",
    "ఆత్మహత్య", "చనిపోవాలి", "మరణం",
    "தற்கொலை", "சாக வேண்டும்", "இறக்க"
}

# Helpline details displayed when crisis is detected
HELPLINES = {
    "title": "🚨 Emergency Mental Health Helplines (India)",
    "message": (
        "If you are in distress or experiencing thoughts of self-harm, please know that you are not alone. "
        "Reach out to these professional support channels immediately:"
    ),
    "numbers": [
        {"name": "Kiran (Mental Health Helpline by Govt. of India)", "number": "1800-599-0019", "availability": "24/7, Toll-Free"},
        {"name": "Tele-MANAS (Govt. of India)", "number": "14416 or 1800-891-4416", "availability": "24/7, Toll-Free"},
        {"name": "Vandrevala Foundation", "number": "+91 9999 666 555", "availability": "24/7"},
        {"name": "AASRA", "number": "+91 98204 66726", "availability": "24/7"},
        {"name": "iCall (TISS)", "number": "+91 91529 87821", "availability": "Mon-Sat, 10 AM - 8 PM"}
    ]
}
