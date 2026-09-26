from app import config
from app.api.chat import HistoryItem, _history_pairs
from app.rag.prompts import QA_PROMPT
from app.rag.retriever import MitraRAG


def test_language_mapping():
    assert config.language_name("te") == "Telugu (తెలుగు)"
    assert config.language_name("xx") == "English"
    assert config.sarvam_language("ta", "tts") == "ta-IN"


def test_prompt_construction_includes_all_parts():
    text = QA_PROMPT.format(context="CTX", language="English", chat_history="H", question="Q?")
    assert "CTX" in text and "English" in text and "Q?" in text


def test_history_pairs():
    pairs = _history_pairs([
        HistoryItem(role="user", content="a"), HistoryItem(role="assistant", content="b"),
        HistoryItem(role="user", content="c"),
    ])
    assert pairs == [("a", "b")]


def test_retriever_offline_without_index(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "FAISS_INDEX_DIR", tmp_path)
    rag = MitraRAG()
    assert rag.is_index_available() is False
    result = rag.query("hello", [], "English")
    assert result["sources"] == []


def test_query_returns_structured_sources_without_network():
    from types import SimpleNamespace

    class FakeDB:
        def similarity_search(self, q, k=3):
            doc = lambda name, page: SimpleNamespace(page_content="text", metadata={"source_name": name, "page": page})
            return [doc("a.txt", None), doc("a.txt", None), doc("b.pdf", 3)]

    class FakeLLM:
        def invoke(self, prompt):
            return SimpleNamespace(content=" fine ")

    rag = MitraRAG.__new__(MitraRAG)
    rag.db, rag.llm, rag.setup_complete = FakeDB(), FakeLLM(), True
    result = rag.query("q", [], "English")
    assert result["answer"] == "fine"
    assert result["sources_detail"] == [{"title": "a.txt", "page": None}, {"title": "b.pdf", "page": 3}]
    assert sorted(result["sources"]) == ["a.txt", "b.pdf"]
