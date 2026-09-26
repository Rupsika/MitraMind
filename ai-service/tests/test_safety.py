import pytest

from app.safety import pipeline
from app.safety.rules import highest_rule_level


@pytest.mark.parametrize("text,level", [
    ("I want to kill myself", "CRISIS_SIGNAL"),
    ("मैं आत्महत्या करना चाहता हूँ", "CRISIS_SIGNAL"),
    ("నాకు చనిపోవాలని ఉంది", "CRISIS_SIGNAL"),
    ("எனக்கு தற்கொலை எண்ணம் வருகிறது", "CRISIS_SIGNAL"),
    ("I feel hopeless", "HIGH_CONCERN"),
    ("I am so stressed about exams", "DISTRESS"),
    ("What is a good breathing exercise?", "NORMAL"),
])
def test_rules(text, level):
    assert highest_rule_level(text) == level


def test_pipeline_crisis_shows_helplines():
    r = pipeline.analyze("I want to end my life")
    assert r.risk_level == "CRISIS_SIGNAL" and r.show_crisis_resources and r.helplines


def test_pipeline_normal_has_no_helplines():
    r = pipeline.analyze("Tell me about mindfulness")
    assert r.risk_level == "NORMAL" and r.helplines is None


def test_context_escalates_distress():
    r = pipeline.analyze("I am stressed again", context=["I feel hopeless", "I feel worthless"])
    assert r.risk_level == "HIGH_CONCERN" and r.trigger_type == "context"


def test_classifier_returns_probabilities():
    from app.safety.classifier import classify
    probs = classify("I feel very sad")
    assert set(probs) == {"NORMAL", "DISTRESS", "HIGH_CONCERN", "CRISIS_SIGNAL"}
    assert abs(sum(probs.values()) - 1) < 1e-6
