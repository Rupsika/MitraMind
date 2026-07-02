import sys
from pathlib import Path

# Add project root to sys.path to enable absolute imports
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from rag.ingest import build_vector_store

if __name__ == "__main__":
    print("Starting document ingestion process for MitraMind...")
    try:
        success = build_vector_store()
        if success:
            print("Ingestion completed successfully.")
        else:
            print("Ingestion failed. No documents indexed.")
    except Exception as e:
        print(f"CRITICAL ERROR during ingestion: {str(e)}")
        print("\nPlease ensure you have placed your API keys in a `.env` file (e.g. by copying `.env.example` to `.env` and filling in the values).")
        sys.exit(1)
