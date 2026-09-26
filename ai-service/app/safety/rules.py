"""Rule-based safety signals. Deterministic, multilingual (en/hi/te/ta).

Rules are intentionally conservative: they favour recall for crisis language.
They are one input to the pipeline, never the only one.
"""
import re
from dataclasses import dataclass
from typing import List

LEVELS = ["NORMAL", "DISTRESS", "HIGH_CONCERN", "CRISIS_SIGNAL"]


def level_rank(level: str) -> int:
    return LEVELS.index(level)


@dataclass(frozen=True)
class RuleHit:
    level: str
    trigger: str


CRISIS_PATTERNS = [
    r"\bkill (myself|my self)\b", r"\bend (my|my own) life\b", r"\bend it all\b", r"\bsuicid",
    r"\bwant to die\b", r"\bwish i (was|were) dead\b", r"\bbetter off (dead|without me)\b",
    r"\bno reason to live\b", r"\bdon'?t want to (live|be alive|exist)\b",
    r"\bgoing to (hurt|harm) myself\b", r"\bcut(ting)? myself\b", r"\btake my (own )?life\b",
    r"आत्महत्या", r"मरना चाहता", r"मरना चाहती", r"जान दे", r"जीना नहीं चाहता", r"जीना नहीं चाहती", r"खुद को खत्म",
    r"ఆత్మహత్య", r"చనిపోవాల", r"చచ్చిపోవాల", r"బతకాలని లేదు",
    r"தற்கொலை", r"சாக வேண்டும்", r"சாகணும்", r"வாழ விருப்பம் இல்லை", r"உயிரை மாய்த்",
]

HIGH_CONCERN_PATTERNS = [
    r"\bhopeless\b", r"\bworthless\b", r"\bcan'?t (go on|take it|cope|do this anymore)\b", r"\bno way out\b",
    r"\bnobody would (care|miss)\b", r"\bself[- ]harm\b", r"\bhurt myself\b", r"\bgive up on (life|everything)\b",
    r"\bpanic attacks?\b", r"\bcan'?t stop crying\b", r"\bstopped eating\b",
    r"निराश", r"बेकार हूँ", r"सहन नहीं", r"हार मान", r"खुद को नुकसान",
    r"నిరాశ", r"భరించలేను", r"విలువ లేదు", r"నన్ను నేను గాయ",
    r"நம்பிக்கை இல்லை", r"தாங்க முடியவில்லை", r"பயனற்ற", r"என்னை நானே காயப்படுத்",
]

DISTRESS_PATTERNS = [
    r"\bstress(ed)?\b", r"\banxious\b", r"\banxiety\b", r"\bworried\b", r"\bsad\b", r"\bdepress", r"\boverwhelm",
    r"\blonely\b", r"\bexhausted\b", r"\bburn(ed|t)? out\b", r"\bcan'?t sleep\b", r"\bupset\b", r"\bafraid\b",
    r"तनाव", r"चिंता", r"उदास", r"घबराहट", r"अकेला", r"अकेली", r"थक",
    r"ఒత్తిడి", r"ఆందోళన", r"బాధ", r"ఒంటరి", r"భయం",
    r"மன அழுத்தம்", r"கவலை", r"சோகம்", r"தனிமை", r"பயம்",
]

_COMPILED = [
    ("CRISIS_SIGNAL", [re.compile(p, re.IGNORECASE) for p in CRISIS_PATTERNS]),
    ("HIGH_CONCERN", [re.compile(p, re.IGNORECASE) for p in HIGH_CONCERN_PATTERNS]),
    ("DISTRESS", [re.compile(p, re.IGNORECASE) for p in DISTRESS_PATTERNS]),
]


def rule_signals(text: str) -> List[RuleHit]:
    """Return every rule hit for the text (trigger = the pattern that matched)."""
    hits: List[RuleHit] = []
    for level, patterns in _COMPILED:
        for pat in patterns:
            if pat.search(text or ""):
                hits.append(RuleHit(level, pat.pattern))
    return hits


def highest_rule_level(text: str) -> str:
    hits = rule_signals(text)
    if not hits:
        return "NORMAL"
    return max((h.level for h in hits), key=level_rank)
