"""Lightweight ML classifier for risk level.

TF-IDF character n-grams + logistic regression, trained at first use on the
seed dataset in training_data.json. This is a small model trained on a small,
author-written dataset: it supplements the rules and must not be treated as a
validated clinical instrument. See tests/evaluation for measured performance.
"""
import json
from pathlib import Path
from typing import Dict

from app.safety.rules import LEVELS

DATA_PATH = Path(__file__).with_name("training_data.json")
_model = None


def _train():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline

    with open(DATA_PATH, encoding="utf-8") as f:
        rows = json.load(f)
    texts = [r["text"] for r in rows]
    labels = [r["label"] for r in rows]
    model = make_pipeline(
        TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), lowercase=True, sublinear_tf=True),
        LogisticRegression(max_iter=2000, C=5.0, class_weight="balanced"),
    )
    model.fit(texts, labels)
    return model


def get_model():
    global _model
    if _model is None:
        _model = _train()
    return _model


def classify(text: str) -> Dict[str, float]:
    """Return {level: probability} for all four levels."""
    model = get_model()
    probs = model.predict_proba([text or ""])[0]
    out = {lvl: 0.0 for lvl in LEVELS}
    for cls, p in zip(model.classes_, probs):
        out[cls] = float(p)
    return out


def predict(text: str) -> tuple:
    """Return (level, confidence)."""
    probs = classify(text)
    level = max(probs, key=probs.get)
    return level, probs[level]
