import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main  # noqa: E402
from workers import HANDLERS  # noqa: E402


class FakeRedis:
    def __init__(self):
        self.lists = {}

    def lpush(self, key, value):
        self.lists.setdefault(key, []).append(value)


def test_runs_known_job(monkeypatch):
    calls = []
    monkeypatch.setitem(HANDLERS, "reindex_knowledge_base", lambda p: calls.append(p))
    main.process(FakeRedis(), json.dumps({"type": "reindex_knowledge_base", "payload": {"a": 1}}))
    assert calls == [{"a": 1}]


def test_rejects_unknown_job():
    r = FakeRedis()
    main.process(r, json.dumps({"type": "nope"}))
    assert main.FAILED in r.lists


def test_retries_then_dead_letters(monkeypatch):
    def boom(_):
        raise RuntimeError("x")

    monkeypatch.setitem(HANDLERS, "reindex_knowledge_base", boom)
    r = FakeRedis()
    raw = json.dumps({"type": "reindex_knowledge_base"})
    for _ in range(main.MAX_ATTEMPTS):
        main.process(r, raw)
        raw = r.lists[main.QUEUE].pop() if r.lists.get(main.QUEUE) else raw
    assert main.FAILED in r.lists
