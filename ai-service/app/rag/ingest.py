import os
import glob
from pathlib import Path
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from app import config

def get_embeddings():
    """
    Get the embedding model based on configuration and available API keys.
    """
    if config.LLM_PROVIDER == "google":
        if not config.GOOGLE_API_KEY:
            raise ValueError(
                "GOOGLE_API_KEY environment variable is not set. "
                "Please configure it in a .env file to generate embeddings."
            )
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=config.GOOGLE_API_KEY
        )
    elif config.LLM_PROVIDER == "openai":
        if not config.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please configure it in a .env file to generate embeddings."
            )
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(openai_api_key=config.OPENAI_API_KEY)
    else:
        raise ValueError(f"Unsupported LLM provider: {config.LLM_PROVIDER}")

def load_documents(directory_path: Path):
    """
    Load all supported documents (txt, pdf, md) from the knowledge base directory.
    """
    documents = []
    # Find all files in the knowledge base directory
    file_patterns = ["*.txt", "*.pdf", "*.md"]
    
    for pattern in file_patterns:
        # Search recursively
        files = glob.glob(str(directory_path / "**" / pattern), recursive=True)
        for file_path in files:
            file_path = Path(file_path)
            try:
                if file_path.suffix.lower() == ".pdf":
                    loader = PyPDFLoader(str(file_path))
                else:
                    loader = TextLoader(str(file_path), encoding="utf-8")
                
                docs = loader.load()
                # Store source metadata as simple filename for cleaner citation
                for d in docs:
                    d.metadata["source_name"] = file_path.name
                
                documents.extend(docs)
                print(f"Successfully loaded: {file_path.name} ({len(docs)} pages/docs)")
            except Exception as e:
                print(f"Error loading {file_path.name}: {str(e)}")
                
    return documents

def build_vector_store():
    """
    Load documents, split them, embed, and save to FAISS vector index.
    """
    print(f"Scanning knowledge base directory: {config.KNOWLEDGE_BASE_DIR}")
    raw_docs = load_documents(config.KNOWLEDGE_BASE_DIR)
    
    if not raw_docs:
        print("No documents found in knowledge base directory!")
        return False
        
    print(f"Splitting {len(raw_docs)} documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP
    )
    split_docs = text_splitter.split_documents(raw_docs)
    print(f"Created {len(split_docs)} document chunks.")
    
    print("Initializing embeddings model...")
    embeddings = get_embeddings()
    
    print("Building FAISS index (this may take a few seconds)...")
    db = FAISS.from_documents(split_docs, embeddings)
    
    print(f"Saving FAISS index to: {config.FAISS_INDEX_DIR}")
    db.save_local(str(config.FAISS_INDEX_DIR))
    print("FAISS index successfully built and saved!")
    return True

if __name__ == "__main__":
    build_vector_store()
