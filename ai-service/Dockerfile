# Build context is the repository root (see docker-compose.yml).
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv/ai-service

COPY ai-service/requirements.txt .
RUN pip install -r requirements.txt

COPY ai-service/app ./app
COPY ai-service/docker-entrypoint.sh ./docker-entrypoint.sh
COPY knowledge-base /srv/knowledge-base
RUN chmod +x docker-entrypoint.sh && useradd -m app && mkdir -p data/faiss_index && chown -R app /srv
USER app

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
