"""Safety pipeline: rules + ML classifier + conversation context.

The LLM is never consulted here. Crisis-level responses use verified helpline
data from app.config, never generated text.
"""
from dataclasses import dataclass, field
from typing import List, Optional

from app import config
from app.safety.classifier import predict
from app.safety.rules import level_rank, rule_signals

# ML predictions only raise the level above rules when reasonably confident.
ML_MIN_CONFIDENCE = {"DISTRESS": 0.55, "HIGH_CONCERN": 0.50, "CRISIS_SIGNAL": 0.45}

ACTIONS = {
    "NORMAL": "none",
    "DISTRESS": "supportive_response_with_resource",
    "HIGH_CONCERN": "encourage_human_support",
    "CRISIS_SIGNAL": "show_crisis_resources",
}


@dataclass
class SafetyResult:
    risk_level: str
    trigger_type: str  # rule | classifier | context | none
    action: str
    signals: List[str] = field(default_factory=list)
    show_crisis_resources: bool = False
    helplines: Optional[dict] = None


def _max_level(texts_hits) -> str:
    return max((h.level for h in texts_hits), key=level_rank, default="NORMAL")


def analyze(message: str, context: Optional[List[str]] = None) -> SafetyResult:
    """Screen a message. `context` is the user's recent earlier messages (oldest first)."""
    hits = rule_signals(message)
    level = _max_level(hits)
    trigger = "rule" if hits else "none"

    ml_level, conf = predict(message)
    if level_rank(ml_level) > level_rank(level) and conf >= ML_MIN_CONFIDENCE.get(ml_level, 1.0):
        level, trigger = ml_level, "classifier"

    # Context: repeated elevated messages in recent turns raise the level by one step.
    if context and level in ("DISTRESS", "HIGH_CONCERN"):
        elevated = sum(
            1 for m in context[-5:] if level_rank(_max_level(rule_signals(m))) >= level_rank("HIGH_CONCERN")
        )
        if level == "HIGH_CONCERN" and elevated >= 2:
            level, trigger = "CRISIS_SIGNAL", "context"
        elif level == "DISTRESS" and elevated >= 1:
            level, trigger = "HIGH_CONCERN", "context"

    return SafetyResult(
        risk_level=level,
        trigger_type=trigger,
        action=ACTIONS[level],
        signals=sorted({h.trigger for h in hits})[:5],
        show_crisis_resources=level == "CRISIS_SIGNAL",
        helplines=config.HELPLINES if level in ("CRISIS_SIGNAL", "HIGH_CONCERN") else None,
    )


CRISIS_MESSAGES = {
    "en": "I'm really glad you told me. What you're feeling matters, and you don't have to face it alone. "
          "Please reach out to someone right now, either a person you trust or one of the support lines below. "
          "If you are in immediate danger, contact your local emergency services.",
    "hi": "आपने मुझे बताया, यह मेरे लिए महत्वपूर्ण है। आप इसे अकेले नहीं झेल रहे हैं। "
          "कृपया अभी किसी भरोसेमंद व्यक्ति या नीचे दी गई हेल्पलाइन से बात करें। "
          "यदि आप तुरंत खतरे में हैं, तो स्थानीय आपातकालीन सेवाओं से संपर्क करें।",
    "te": "మీరు నాతో చెప్పినందుకు ధన్యవాదాలు. మీరు దీన్ని ఒంటరిగా ఎదుర్కోవాల్సిన అవసరం లేదు. "
          "దయచేసి ఇప్పుడే మీరు నమ్మే వ్యక్తితో లేదా క్రింది హెల్ప్‌లైన్‌లలో ఒకదానితో మాట్లాడండి. "
          "మీరు వెంటనే ప్రమాదంలో ఉంటే, స్థానిక అత్యవసర సేవలను సంప్రదించండి.",
    "ta": "நீங்கள் என்னிடம் சொன்னதற்கு நன்றி. இதை நீங்கள் தனியாக எதிர்கொள்ள வேண்டியதில்லை. "
          "தயவுசெய்து இப்போதே நம்பிக்கைக்குரிய ஒருவரிடம் அல்லது கீழேயுள்ள உதவி எண்களில் ஒன்றில் பேசுங்கள். "
          "உடனடி ஆபத்தில் இருந்தால், உள்ளூர் அவசர சேவைகளை அழைக்கவும்.",
}

HIGH_CONCERN_NOTE = {
    "en": "It may also help to talk with someone you trust or a counsellor. Support lines are listed below.",
    "hi": "किसी भरोसेमंद व्यक्ति या काउंसलर से बात करना भी मददगार हो सकता है। हेल्पलाइन नीचे दी गई हैं।",
    "te": "మీరు నమ్మే వ్యక్తితో లేదా కౌన్సెలర్‌తో మాట్లాడటం కూడా సహాయపడవచ్చు. హెల్ప్‌లైన్‌లు క్రింద ఉన్నాయి.",
    "ta": "நம்பிக்கைக்குரிய ஒருவரிடம் அல்லது ஆலோசகரிடம் பேசுவதும் உதவலாம். உதவி எண்கள் கீழே உள்ளன.",
}


def crisis_message(language: str) -> str:
    return CRISIS_MESSAGES.get((language or "en")[:2], CRISIS_MESSAGES["en"])


def high_concern_note(language: str) -> str:
    return HIGH_CONCERN_NOTE.get((language or "en")[:2], HIGH_CONCERN_NOTE["en"])
