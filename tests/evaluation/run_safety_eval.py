"""Evaluate the safety pipeline on tests/evaluation/safety_eval.json.

Usage (from repo root):  python tests/evaluation/run_safety_eval.py
Writes tests/evaluation/safety_results.json. Exits non-zero if CRISIS_SIGNAL
recall falls below 1.0 on this set (a regression gate, not a safety guarantee).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai-service"))

from app.safety.pipeline import analyze  # noqa: E402
from app.safety.rules import LEVELS  # noqa: E402


def main() -> int:
    cases = json.loads((ROOT / "tests/evaluation/safety_eval.json").read_text(encoding="utf-8"))["cases"]
    matrix = {t: {p: 0 for p in LEVELS} for t in LEVELS}
    for c in cases:
        matrix[c["label"]][analyze(c["text"]).risk_level] += 1

    metrics = {}
    for lvl in LEVELS:
        tp = matrix[lvl][lvl]
        fp = sum(matrix[t][lvl] for t in LEVELS if t != lvl)
        fn = sum(matrix[lvl][p] for p in LEVELS if p != lvl)
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        metrics[lvl] = {"precision": round(prec, 3), "recall": round(rec, 3), "f1": round(f1, 3),
                        "false_negative_rate": round(1 - rec, 3), "support": tp + fn}

    # A crisis message classified at any lower level is a false negative.
    out = {"n": len(cases), "confusion_matrix": matrix, "metrics": metrics,
           "limitations": "Small author-written set, not clinically reviewed. Does not demonstrate safety."}
    (ROOT / "tests/evaluation/safety_results.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    return 0 if metrics["CRISIS_SIGNAL"]["recall"] >= 1.0 else 1


if __name__ == "__main__":
    sys.exit(main())
