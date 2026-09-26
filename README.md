# MitraMind

> A little support, in a language that feels like home.

MitraMind is a multilingual (English, Hindi, Telugu, Tamil) mental-wellness support app: daily check-ins, grounded chat with citations, voice input/output, a curated wellness library, recommendations and progress tracking, with a safety layer that is independent of the LLM.

**It is a wellness support and information tool, not a therapist, a diagnostic system, or a substitute for professional or emergency care.**

## Architecture

```
React + TS (Vite, Redux Toolkit, Tailwind)
        │  REST /api/v1
Node + Express + TS ── Prisma ── PostgreSQL
        │        └── Redis (rate limiting, resource cache, job queue)
        │ HTTP
FastAPI AI service ── Safety (rules + ML classifier + context)
        ├── RAG: LangChain + FAISS + Gemini
        └── Voice: Sarvam ASR / TTS
Worker (Python) ── Redis queue ── AI service
```

Node owns auth, authorization, persistence and orchestration. The Python service owns safety, RAG, Gemini and voice.

```
frontend/         React app (+ Cypress e2e in frontend/cypress)
backend/          Express API, Prisma schema + migration, seed
ai-service/       FastAPI: app/{api,rag,voice,safety}, tests/
worker/           Redis-list job worker (knowledge-base reindex)
knowledge-base/   Curated source documents indexed by FAISS
tests/evaluation/ RAG + safety evaluation data and scripts
docker-compose.yml, .github/workflows/{ci,deploy}.yml
```

The original Streamlit prototype was migrated, not rewritten: `rag/`, `voice/` and `config.py` moved to `ai-service/app/` with git history preserved (`git log --follow`). The Streamlit UI was removed; it's in history at commit `b0b757f`.

## Run locally

Prerequisites: Node 22+, Python 3.12+, PostgreSQL 16, Redis (optional locally).

```bash
cp .env.example .env        # set JWT_SECRET, DATABASE_URL, GOOGLE_API_KEY (+ SARVAM_API_KEY for voice)

# 1. AI service  (http://localhost:8000/health)
cd ai-service && pip install -r requirements.txt
python -m app.rag.ingest                       # builds the FAISS index from knowledge-base/documents
uvicorn app.main:app --reload --port 8000

# 2. Backend     (http://localhost:4000/health)
cd backend && npm ci
npx prisma migrate deploy && npm run seed      # creates tables, seeds curated wellness activities
npm run dev

# 3. Frontend    (http://localhost:5173, proxies /api to :4000)
cd frontend && npm ci && npm run dev
```

Or everything at once: `docker compose up --build` (needs `JWT_SECRET`, `POSTGRES_PASSWORD`, `GOOGLE_API_KEY` in `.env`; app on http://localhost:8080). After first start seed the activities: `docker compose exec backend npm run seed:prod`.

## Production deployment

**Architecture:** Browser → Vite frontend (Vercel) → Express backend (Vercel) → Neon PostgreSQL; backend → FastAPI AI service (Render, Docker) → Gemini / FAISS / Sarvam. The worker and Redis are optional and not needed for the core app.

The AI service is *not* deployed on Vercel: it needs a writable FAISS index directory (built at startup via a Gemini call) and heavy native dependencies (faiss-cpu, scikit-learn, langchain). It uses the existing `ai-service/Dockerfile`.

### Environment variables
| Where | Variable | Notes |
|---|---|---|
| Backend (Vercel) | `DATABASE_URL` | Neon pooled connection string |
| | `JWT_SECRET` | 32+ random chars |
| | `AI_SERVICE_URL` | AI service public URL |
| | `FRONTEND_URL` | Deployed frontend origin (CORS allow-list) |
| | `NODE_ENV` | `production` |
| Frontend (Vercel) | `VITE_API_URL` | `https://<backend-domain>/api/v1` (build-time) |
| AI service (Render) | `GOOGLE_API_KEY`, `SARVAM_API_KEY`, `INTERNAL_API_TOKEN` | see `render.yaml` |

See `.env.example` for names only. Never commit real values.

### Neon database
Create the database in Neon and copy the pooled connection string into `DATABASE_URL`. Apply the existing migrations (never `migrate reset`):
```bash
cd backend && npx prisma migrate deploy
```

### Deploy
1. **AI service:** Render → New → Blueprint from this repo (`render.yaml`), or a Docker web service with Dockerfile `ai-service/Dockerfile` and build context `.`. Set the three secrets, and keep the persistent disk so the index survives restarts.
2. **Backend:** new Vercel project, root directory `backend`. Set the backend variables above. `backend/vercel.json` and `backend/api/index.ts` route all requests to Express.
3. **Frontend:** new Vercel project, root directory `frontend` (Vite, output `dist`). Set `VITE_API_URL`, then redeploy.
4. Set `FRONTEND_URL` on the backend to the frontend URL and redeploy the backend.

Frontend → backend uses `VITE_API_URL`; backend → AI service uses `AI_SERVICE_URL`.

### Health checks
```bash
curl https://<backend-domain>/health
curl https://<ai-service-domain>/health
```

### Security notes
- `.env` files are git-ignored; only `.env.example` is committed.
- CORS is restricted to `CORS_ORIGIN` / `FRONTEND_URL`; no wildcard.
- Rotate any key that was ever shared or committed. `/ai/admin/reindex` is disabled unless `INTERNAL_API_TOKEN` is set.
- On Render's free tier the service sleeps when idle, so the first request can be slow.

## Tests

| Area | Command | Notes |
|---|---|---|
| AI service | `cd ai-service && python -m pytest` | Gemini/Sarvam are mocked |
| Worker | `cd worker && python -m pytest tests` | |
| Backend | `cd backend && npm test` | Jest + Supertest against an in-memory Prisma fake |
| Frontend | `cd frontend && npm test` | Vitest + React Testing Library |
| E2E | `cd frontend && npm run dev` then `npm run e2e` | Cypress, API stubbed with `cy.intercept` |
| Safety eval | `python tests/evaluation/run_safety_eval.py` | precision / recall / F1 / confusion matrix |
| RAG eval | `python tests/evaluation/run_rag_eval.py` | Recall@K, Precision@K, citation correctness; needs `GOOGLE_API_KEY` + index |

## Safety design

`POST /ai/chat` always screens the message first: rule patterns (en/hi/te/ta) + a small TF-IDF/logistic-regression classifier + recent-message context → `NORMAL | DISTRESS | HIGH_CONCERN | CRISIS_SIGNAL`.

- `CRISIS_SIGNAL`: generation is skipped. A fixed, translated supportive message and the verified helplines from `ai-service/app/config.py` (taken from `knowledge-base/documents/crisis_resources_india.txt`) are returned. The LLM never writes helpline numbers.
- `HIGH_CONCERN`: normal grounded answer plus a note encouraging human support and the helpline list.
- Only `risk_level`, `trigger_type` and `action_shown` are stored in `safety_events`, never message text.

**Limitations.** The classifier is trained on ~60 author-written examples and the evaluation set (`tests/evaluation/safety_eval.json`, 25 cases) is also author-written and *not clinically reviewed*. Results show regression behaviour, not real-world safety. Have a qualified reviewer validate labels, wording and the helpline list before any real-user release.

## API

Base `/api/v1` (JWT bearer): `auth/{register,login,me,logout}`, `chat/{conversations,history,:id,:id/messages}`, `checkins[/summary]`, `resources[/:id/{start,complete}]`, `progress`, `recommendations`, `voice/{transcribe,synthesize}`, `safety/analyze`. Inputs are validated with Zod (e.g. check-in scores are integers 1–10).

## Privacy

Message text, audio, passwords and tokens are never logged; logs contain request id, endpoint, status and latency only. Conversation content is stored in Postgres per user and is only readable by its owner. Define and implement a retention policy before real use.

## Status against the implementation plan

Implemented and tested: AI service (`/health`, `/ai/chat`, `/ai/transcribe`, `/ai/synthesize`, `/ai/safety/analyze`), Node API, Prisma schema + migration, auth, check-ins with weekly pattern summary, chat + history + sources, four UI languages, hold-to-speak voice UI, safety layer, wellness library with progress, rule-based recommendations, progress charts, Redis rate limiting/caching, worker, Docker files, CI workflow, Cypress.

Not done / caveats:
- **Docker images and `docker compose` were not built or run** in the development environment (no Docker available). Treat them as unverified.
- **Backend tests use an in-memory Prisma fake**; the migration SQL was generated from the schema but never applied to a real Postgres.
- **Voice** works only with a valid `SARVAM_API_KEY`; the browser records, converts to WAV and posts it, but this path was not exercised against Sarvam. Cypress does not cover voice.
- **Deploy workflow** is a gated placeholder (`DEPLOY_ENABLED`); no cloud provider chosen. **Kubernetes, admin dashboard and advanced observability** (plan phases J/36) were not started.
- The recommendation engine lives in the Node backend (it owns the data) rather than `ai-service/app/recommendation/`.
- Hindi/Telugu/Tamil UI strings were machine-drafted and need native-speaker review; some Telugu/Tamil strings fall back to English. Wellness activities are English only.
- JWT is kept in `localStorage` for simplicity; consider httpOnly cookies before production.
- The knowledge base is four short documents; RAG metrics on it (Recall@3 = 1.0 in the last run) say little about coverage.
