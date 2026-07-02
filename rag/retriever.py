import os
from typing import List, Dict, Any, Tuple
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage, AIMessage

import config
from rag.ingest import get_embeddings
from rag.prompts import QA_PROMPT, REPHRASE_QUESTION_PROMPT

class MitraRAG:
    def __init__(self):
        self.db = None
        self.llm = None
        self.embeddings = None
        self.setup_complete = False
        
        # Initialize pipeline if keys are present
        try:
            self.initialize_pipeline()
        except Exception as e:
            print(f"MitraRAG Initialization warning: {str(e)}")

    def is_index_available(self) -> bool:
        """Checks if the FAISS vector index has been built and exists locally."""
        faiss_file = config.FAISS_INDEX_DIR / "index.faiss"
        pkl_file = config.FAISS_INDEX_DIR / "index.pkl"
        return faiss_file.exists() and pkl_file.exists()

    def initialize_pipeline(self):
        """Initializes embeddings, vector store and LLM client."""
        if not self.is_index_available():
            raise FileNotFoundError("FAISS index files not found. Please run data/ingest_docs.py first.")
            
        self.embeddings = get_embeddings()
        self.db = FAISS.load_local(
            str(config.FAISS_INDEX_DIR), 
            self.embeddings, 
            allow_dangerous_deserialization=True
        )
        
        # Configure LLM
        if config.LLM_PROVIDER == "google":
            if not config.GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY missing.")
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=config.GOOGLE_API_KEY,
                temperature=0.4
            )
        elif config.LLM_PROVIDER == "openai":
            if not config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY missing.")
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                openai_api_key=config.OPENAI_API_KEY,
                temperature=0.4
            )
        else:
            raise ValueError(f"Unsupported provider: {config.LLM_PROVIDER}")
            
        self.setup_complete = True

    def check_crisis(self, text: str) -> bool:
        """
        Check if the input text contains any emergency or crisis keywords.
        """
        text_lower = text.lower()
        for kw in config.CRISIS_KEYWORDS:
            if kw in text_lower:
                return True
        return False

    def format_chat_history(self, history: List[Tuple[str, str]]) -> str:
        """Format list of (user_msg, bot_msg) tuples into readable text block."""
        formatted = []
        for user, bot in history:
            formatted.append(f"User: {user}")
            formatted.append(f"Mitra: {bot}")
        return "\n".join(formatted)

    def get_standalone_question(self, question: str, history_str: str) -> str:
        """Uses LLM to rephrase question using history if history exists."""
        if not history_str or not self.llm:
            return question
            
        prompt = REPHRASE_QUESTION_PROMPT.format(
            chat_history=history_str,
            question=question
        )
        try:
            response = self.llm.invoke(prompt)
            return response.content.strip()
        except Exception as e:
            print(f"Error rephrasing question: {str(e)}")
            return question

    def query(self, question: str, history: List[Tuple[str, str]], language: str = "English") -> Dict[str, Any]:
        """
        Main query pipeline:
        1. Detect crisis keywords.
        2. Format history and get standalone question.
        3. Retrieve document chunks from FAISS.
        4. Query LLM with prompt injected with context, history, and language instructions.
        """
        # 1. Crisis check
        crisis_triggered = self.check_crisis(question)
        
        if not self.setup_complete:
            # Attempt re-initialization if not done yet
            try:
                self.initialize_pipeline()
            except Exception as e:
                # Return placeholder if keys are missing
                fallback_msg = (
                    "Hello! I am in offline mode because the host API keys are missing. "
                    "Please ask your administrator to configure the `.env` file with appropriate API keys.\n\n"
                )
                if crisis_triggered:
                    return {
                        "answer": fallback_msg + "I noticed you might be going through a tough time.",
                        "sources": [],
                        "crisis_triggered": True
                    }
                return {
                    "answer": fallback_msg + "How can I help you today?",
                    "sources": [],
                    "crisis_triggered": False
                }
        
        # 2. History formatting and rephrasing
        history_str = self.format_chat_history(history)
        standalone_q = self.get_standalone_question(question, history_str)
        
        # 3. Retrieve documents
        # Retrieve top 3 documents
        retrieved_docs = self.db.similarity_search(standalone_q, k=3)
        context = ""
        sources = set()
        
        for doc in retrieved_docs:
            context += f"\n---\nDocument: {doc.page_content}\n"
            if "source_name" in doc.metadata:
                sources.add(doc.metadata["source_name"])
                
        # 4. Generate response using LLM
        prompt_text = QA_PROMPT.format(
            context=context,
            language=language,
            chat_history=history_str,
            question=standalone_q
        )
        
        try:
            response = self.llm.invoke(prompt_text)
            answer = response.content.strip()
        except Exception as e:
            answer = f"I apologize, I encountered an issue generating a response: {str(e)}"
            
        return {
            "answer": answer,
            "sources": list(sources),
            "crisis_triggered": crisis_triggered
        }
