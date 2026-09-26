"""Retrieval evaluation for the RAG pipeline.

Usage (repo root):  python tests/evaluation/run_rag_eval.py [--k 3] [--min-recall 0.6]

Measures, over questions.json, using the real FAISS index + embeddings:
  - Recall@K:    fraction of questions whose expected source is in the top-K chunks
  - Precision@K: fraction of the retrieved top-K chunks that come from the expected source
  - Citation correctness: expected source appears in the sources the API would cite

NOT measured here: groundedness and hallucination rate. Those need human review or an
LLM judge and are not automated. Results are written to results.json.

Needs GOOGLE_API_KEY and a built index (python -m app.rag.ingest from ai-service/).
Exits 0 with a "skipped" result when no key or index is available (e.g. in CI without secrets).
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai-service"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=3)
    parser.add_argument("--min-recall", type=float, default=0.0)
    args = parser.parse_args()

    from app import config

    out_path = ROOT / "tests/evaluation/results.json"
    index_ok = (config.FAISS_INDEX_DIR / "index.faiss").exists()
    if not config.GOOGLE_API_KEY or not index_ok:
        reason = "no GOOGLE_API_KEY" if not config.GOOGLE_API_KEY else "FAISS index not built"
        out_path.write_text(json.dumps({"status": "skipped", "reason": reason}, indent=2), encoding="utf-8")
        print(f"RAG evaluation skipped: {reason}")
        return 0

    from langchain_community.vectorstores import FAISS

    from app.rag.ingest import get_embeddings

    db = FAISS.load_local(str(config.FAISS_INDEX_DIR), get_embeddings(), allow_dangerous_deserialization=True)
    questions = json.loads((ROOT / "tests/evaluation/questions.json").read_text(encoding="utf-8"))["questions"]

    hits = precision_sum = citation_ok = 0
    rows = []
    for q in questions:
        docs = db.similarity_search(q["question"], k=args.k)
        sources = [d.metadata.get("source_name") for d in docs]
        expected = q["expected_source"]
        found = expected in sources
        hits += found
        precision_sum += sources.count(expected) / max(len(sources), 1)
        citation_ok += found  # sources cited by the API are exactly the retrieved chunks' sources
        rows.append({"question": q["question"], "expected": expected, "retrieved": sources, "hit": found})

    n = len(questions)
    metrics = {
        f"recall@{args.k}": round(hits / n, 3),
        f"precision@{args.k}": round(precision_sum / n, 3),
        "citation_correctness": round(citation_ok / n, 3),
    }
    result = {
        "status": "ok", "n": n, "k": args.k, "metrics": metrics, "rows": rows,
        "limitations": [
            "Tiny knowledge base (4 short documents) and 15 author-written questions.",
            "Groundedness and hallucination rate are not measured automatically.",
            "Retrieval-only: does not evaluate the generated answer.",
        ],
    }
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    return 0 if metrics[f"recall@{args.k}"] >= args.min_recall else 1


if __name__ == "__main__":
    sys.exit(main())
