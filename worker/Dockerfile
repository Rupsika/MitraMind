FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv/worker
COPY worker/requirements.txt .
RUN pip install -r requirements.txt
COPY worker/main.py .
COPY worker/workers ./workers
COPY worker/jobs ./jobs
RUN useradd -m app
USER app
CMD ["python", "main.py"]
