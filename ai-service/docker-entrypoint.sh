#!/bin/sh
set -e
# Build the FAISS index on first start (needs GOOGLE_API_KEY); the index lives on a volume.
if [ ! -f data/faiss_index/index.faiss ]; then
  if [ -n "$GOOGLE_API_KEY$GEMINI_API_KEY" ]; then
    echo "Building FAISS index..."
    python -m app.rag.ingest || echo "Index build failed; chat will run in offline mode."
  else
    echo "No GOOGLE_API_KEY set; skipping index build (chat will run in offline mode)."
  fi
fi
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
