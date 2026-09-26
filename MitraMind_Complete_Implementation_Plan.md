# MitraMind --- Complete Full-Stack Implementation Plan

> **A little support, in a language that feels like home.**

MitraMind is a multilingual mental-wellness support platform that
combines evidence-grounded conversational support, multilingual voice
interaction, wellness check-ins, personalized resources, progress
tracking, and a safety-aware support layer.

The goal is to evolve the existing Python/RAG/voice prototype into a
**clean, production-style full-stack web application**.

> **Product boundary:** MitraMind is a mental-wellness support and
> information platform. It is not a therapist, diagnostic system,
> medical prescription system, or replacement for professional care.

------------------------------------------------------------------------

# 1. Project Goal

The existing MitraMind project already contains the core AI
functionality:

``` text
MitraMind/
├── assets/
├── data/
├── rag/
│   ├── ingest.py
│   ├── prompts.py
│   └── retriever.py
├── voice/
│   ├── audio_utils.py
│   └── sarvam_client.py
├── app.py
├── config.py
├── requirements.txt
└── README.md
```

The existing implementation should be **preserved and refactored**, not
rewritten from scratch.

The final system will add:

-   React + TypeScript frontend
-   Redux Toolkit
-   Node.js + Express + TypeScript backend
-   PostgreSQL + Prisma
-   FastAPI AI service
-   Existing FAISS/RAG pipeline
-   Existing Gemini integration
-   Existing Sarvam voice integration
-   Safety-aware classification
-   Wellness resources
-   Personalized recommendations
-   Check-in and progress tracking
-   Redis
-   Background jobs
-   Automated testing
-   Docker
-   GitHub Actions CI/CD
-   Cloud deployment
-   Optional Kubernetes

------------------------------------------------------------------------

# 2. Product Philosophy

## 2.1 Core Product Loop

``` text
Check in
   ↓
Talk
   ↓
Retrieve trusted information
   ↓
Generate grounded response
   ↓
Recommend useful resource
   ↓
Complete activity
   ↓
Track progress
   ↓
Escalate to human/professional support when necessary
```

## 2.2 What MitraMind Is

-   Multilingual mental-wellness support
-   Evidence-grounded information
-   Reflection/check-in tool
-   Wellness resource library
-   Voice-accessible conversational interface
-   Personalized resource recommendations
-   Safety-aware support

## 2.3 What MitraMind Is Not

-   AI therapist
-   Mental-health diagnosis system
-   Depression detector
-   Medical prescription system
-   Emergency-response replacement
-   Generic ChatGPT clone

------------------------------------------------------------------------

# 3. UI/UX REQUIREMENT

This is a **hard requirement** for the project.

MitraMind must have a **simple, calm, human-designed interface**.

It should NOT look like a generic AI-generated SaaS template.

## 3.1 Design Direction

Think:

> Calm wellness application + modern productivity application

Not:

> Flashy AI startup landing page

The interface should feel:

-   Simple
-   Warm
-   Minimal
-   Trustworthy
-   Human
-   Accessible
-   Modern without being flashy

## 3.2 Avoid

``` text
❌ Excessive gradients
❌ Neon colors
❌ Glassmorphism everywhere
❌ Huge rounded cards
❌ Excessive shadows
❌ Glowing AI effects
❌ Robot/AI illustrations everywhere
❌ "AI-powered" badges everywhere
❌ Too many dashboard widgets
❌ Excessive animations
❌ Generic purple/blue AI template
❌ Excessive 3D illustrations
```

## 3.3 Preferred Visual Style

Use:

-   Soft neutral background
-   White surfaces
-   One restrained accent color
-   Dark readable text
-   Subtle borders
-   Small radius
-   Minimal shadows
-   Consistent spacing
-   One typography family

Example palette:

``` text
Background:     #FAFAF7
Surface:        #FFFFFF
Primary:        muted green / teal
Text:           #222222
Secondary:      #6B7280
Border:         #E5E7EB
```

The exact colors can be refined during implementation.

## 3.4 Typography

Use one clean font family such as:

``` text
Inter
```

or

``` text
Manrope
```

Avoid oversized marketing typography.

Prefer:

``` text
How are you feeling today?
```

over:

``` text
REVOLUTIONIZING MENTAL WELLNESS WITH AI
```

## 3.5 Navigation

Keep navigation small.

``` text
Home
Chat
Check-in
Wellness
Progress
Profile
```

Do not create unnecessary navigation items.

## 3.6 Animation

Only subtle animations:

-   Button hover
-   Loading indicator
-   Chat message appearance
-   Small page transitions
-   Chart animation

Avoid:

-   Floating blobs
-   Glowing backgrounds
-   Constant motion
-   Excessive parallax
-   Decorative animation everywhere

## 3.7 Core UI Principle

> **MitraMind should feel like a thoughtfully designed wellness product
> that happens to use AI --- not an AI product trying to look like a
> wellness app.**

------------------------------------------------------------------------

# 4. Target Architecture

``` text
                         MITRAMIND
                            │
                            ▼
                  ┌────────────────────┐
                  │ React + TypeScript │
                  │ Redux Toolkit      │
                  └─────────┬──────────┘
                            │
                         REST API
                            │
                            ▼
                  ┌────────────────────┐
                  │ Node.js + Express  │
                  │ TypeScript API     │
                  └─────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        PostgreSQL        Redis        FastAPI AI
                                             │
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                           ▼                 ▼                 ▼
                         RAG              Safety             Voice
                           │                 │                 │
                        FAISS             Classifier          Sarvam
                           │
                         Gemini
```

Development/deployment:

``` text
GitHub
   ↓
GitHub Actions
   ↓
Lint + Tests
   ↓
Docker Build
   ↓
Cloud Deployment
   ↓
Optional Kubernetes
```

------------------------------------------------------------------------

# 5. Existing Code Migration

The current AI code must be reused.

## 5.1 Existing RAG

Current:

``` text
rag/
├── __init__.py
├── ingest.py
├── prompts.py
└── retriever.py
```

Target:

``` text
ai-service/
└── app/
    └── rag/
        ├── __init__.py
        ├── ingest.py
        ├── prompts.py
        └── retriever.py
```

## 5.2 Existing Voice

Current:

``` text
voice/
├── __init__.py
├── audio_utils.py
└── sarvam_client.py
```

Target:

``` text
ai-service/
└── app/
    └── voice/
        ├── __init__.py
        ├── audio_utils.py
        └── sarvam_client.py
```

## 5.3 Existing Configuration

Current:

``` text
config.py
```

Target:

``` text
ai-service/app/config.py
```

## 5.4 Existing app.py

The existing `app.py` should be refactored into:

``` text
ai-service/app/main.py
```

The exact migration should preserve the existing RAG and voice behavior.

------------------------------------------------------------------------

# 6. Final Repository Structure

``` text
MitraMind/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── checkin/
│   │   │   ├── wellness/
│   │   │   ├── progress/
│   │   │   └── profile/
│   │   ├── store/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
│
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── chat.py
│   │   │   ├── voice.py
│   │   │   ├── safety.py
│   │   │   └── health.py
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py
│   │   │   ├── prompts.py
│   │   │   └── retriever.py
│   │   ├── voice/
│   │   │   ├── __init__.py
│   │   │   ├── audio_utils.py
│   │   │   └── sarvam_client.py
│   │   ├── safety/
│   │   │   ├── rules.py
│   │   │   ├── classifier.py
│   │   │   └── pipeline.py
│   │   └── recommendation/
│   │       └── engine.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── worker/
│   ├── jobs/
│   ├── workers/
│   ├── main.py
│   └── Dockerfile
│
├── knowledge-base/
│   ├── documents/
│   ├── processed/
│   └── metadata/
│
├── tests/
│   ├── e2e/
│   └── evaluation/
│
├── docker/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

# 7. Technology Stack

## Frontend

``` text
React
TypeScript
Vite
Redux Toolkit
React Router
Tailwind CSS
Axios
Recharts
```

## Backend

``` text
Node.js
Express.js
TypeScript
Prisma
PostgreSQL
```

## AI

``` text
Python
FastAPI
LangChain
FAISS
Gemini
Sarvam AI
```

## Infrastructure

``` text
Redis
Docker
GitHub Actions
Linux
Cloud
Kubernetes (advanced)
```

## Testing

``` text
Jest
Supertest
React Testing Library
Pytest
Cypress
```

------------------------------------------------------------------------

# 8. Phase 0 --- Backup Existing Project

Before restructuring:

``` bash
git status
git add .
git commit -m "chore: backup existing MitraMind AI application"
git checkout -b feature/full-stack-migration
```

### Goal

Ensure the current RAG/voice application remains recoverable.

------------------------------------------------------------------------

# 9. Phase 1 --- Inspect Existing AI Application

Before modifying existing code, inspect:

``` text
app.py
config.py
rag/ingest.py
rag/prompts.py
rag/retriever.py
voice/audio_utils.py
voice/sarvam_client.py
requirements.txt
```

Document:

-   Current application entry point
-   How Gemini is called
-   How FAISS is loaded
-   How retrieval works
-   How prompts are constructed
-   How Sarvam ASR/TTS is called
-   Existing request/response flow
-   Environment variables
-   Existing data files

### Important

Do not rewrite working RAG or voice logic without a reason.

------------------------------------------------------------------------

# 10. Phase 2 --- Create FastAPI AI Service

## Goal

Turn the existing Python application into a reusable AI service.

Create:

``` text
ai-service/
├── app/
│   ├── main.py
│   ├── config.py
│   └── api/
└── requirements.txt
```

Install:

``` text
fastapi
uvicorn
```

------------------------------------------------------------------------

# 11. Phase 3 --- AI Health Endpoint

Implement:

``` http
GET /health
```

Response:

``` json
{
  "status": "ok",
  "service": "mitramind-ai"
}
```

Run:

``` bash
uvicorn app.main:app --reload --port 8000
```

### Milestone

Do not continue until the AI service starts independently.

------------------------------------------------------------------------

# 12. Phase 4 --- AI Chat API

Implement:

``` http
POST /ai/chat
```

Request:

``` json
{
  "message": "I am feeling stressed about exams",
  "language": "en",
  "conversation_id": "123"
}
```

Flow:

``` text
Message
   ↓
Safety screening
   ↓
Language processing
   ↓
Retriever
   ↓
FAISS
   ↓
Prompt construction
   ↓
Gemini
   ↓
Response
```

Response:

``` json
{
  "answer": "...",
  "language": "en",
  "riskLevel": "NORMAL",
  "sources": [
    {
      "title": "WHO",
      "page": 14
    }
  ]
}
```

------------------------------------------------------------------------

# 13. Phase 5 --- AI Voice APIs

Implement:

``` http
POST /ai/transcribe
POST /ai/synthesize
```

Use the existing:

``` text
voice/audio_utils.py
voice/sarvam_client.py
```

### Transcription

``` text
Browser audio
   ↓
FastAPI
   ↓
Sarvam ASR
   ↓
Text
```

### Synthesis

``` text
AI response
   ↓
FastAPI
   ↓
Sarvam TTS
   ↓
Audio
```

------------------------------------------------------------------------

# 14. Phase 6 --- Build Node.js Backend

Create:

``` text
backend/
```

Use:

``` text
Node.js
Express
TypeScript
Prisma
```

Architecture:

``` text
Route
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

Controllers should stay thin. Business logic belongs in services.

------------------------------------------------------------------------

# 15. Phase 7 --- PostgreSQL Database

Create the following entities.

## users

``` text
id
name
email
password_hash
preferred_language
timezone
created_at
updated_at
```

## profiles

``` text
id
user_id
notification_preferences
created_at
updated_at
```

## conversations

``` text
id
user_id
title
language
created_at
updated_at
```

## messages

``` text
id
conversation_id
role
content
language
created_at
```

## mood_checkins

``` text
id
user_id
mood
stress_level
energy_level
sleep_quality
note
created_at
```

## wellness_resources

``` text
id
title
description
category
duration
language
instructions
source
created_at
```

## resource_progress

``` text
id
user_id
resource_id
started_at
completed_at
status
```

## recommendations

``` text
id
user_id
resource_id
reason
created_at
```

## safety_events

``` text
id
user_id
risk_level
trigger_type
action_shown
created_at
```

Store only information needed for the system's operation.

------------------------------------------------------------------------

# 16. Phase 8 --- Authentication

Implement:

``` http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Use:

``` text
bcrypt
JWT
```

Registration:

``` text
Name
Email
Password
Preferred language
Timezone
```

Add protected routes.

------------------------------------------------------------------------

# 17. Phase 9 --- React Frontend

Create:

``` text
frontend/
```

Pages:

``` text
/
 /login
 /register

 /dashboard
 /chat
 /check-in
 /wellness
 /progress
 /history
 /resources
 /profile
 /settings
```

Use Redux slices:

``` text
authSlice
chatSlice
checkinSlice
wellnessSlice
progressSlice
profileSlice
```

------------------------------------------------------------------------

# 18. Phase 10 --- Landing Page

The landing page should be minimal.

## Hero

``` text
MitraMind

A little support,
in a language that feels like home.

Talk, reflect and explore evidence-grounded
wellness resources in a language you're comfortable with.

[Start a check-in] [Talk to Mitra]
```

## Sections

``` text
Talk
Reflect
Explore
```

Show supported languages:

``` text
English · हिन्दी · తెలుగు · தமிழ்
```

Avoid:

-   Giant AI graphics
-   Excessive gradients
-   AI buzzwords
-   Overly animated backgrounds
-   Huge collections of cards

------------------------------------------------------------------------

# 19. Phase 11 --- Authentication UI

Create:

``` text
/login
/register
```

Login:

``` text
Email
Password

[Login]
```

Register:

``` text
Name
Email
Password
Preferred language

[Create account]
```

After authentication:

``` text
Redux auth state
      ↓
Protected routes
      ↓
Dashboard
```

------------------------------------------------------------------------

# 20. Phase 12 --- Dashboard

The dashboard should be calm and focused.

Components:

``` text
Welcome message
Daily check-in
Recent check-ins
One recommendation
Recent conversation
Talk to Mitra
```

Do not create a dashboard full of statistics.

Preferred structure:

``` text
Good morning.

How are you feeling today?

[ mood selector ]

Recent check-ins
[small chart]

Something you can try
[one resource]

Talk to Mitra →
```

------------------------------------------------------------------------

# 21. Phase 13 --- Daily Check-in

Page:

``` text
/check-in
```

Inputs:

``` text
Mood
Stress
Energy
Sleep quality
Optional note
```

API:

``` http
POST /api/v1/checkins
GET  /api/v1/checkins
GET  /api/v1/checkins/summary
```

The application should describe recorded patterns, not diagnose users.

Example:

``` text
Your recorded stress level was higher this week.
```

Avoid:

``` text
You have anxiety.
```

------------------------------------------------------------------------

# 22. Phase 14 --- Full Chat Integration

Architecture:

``` text
React
  ↓
POST /api/v1/chat
  ↓
Node.js
  ↓
POST /ai/chat
  ↓
FastAPI
  ↓
Safety
  ↓
RAG
  ↓
FAISS
  ↓
Gemini
  ↓
Sources
  ↓
FastAPI
  ↓
Node
  ↓
PostgreSQL
  ↓
React
```

The Node backend owns:

-   Authentication
-   User authorization
-   Conversation storage
-   Message storage
-   API orchestration

The Python service owns:

-   RAG
-   Gemini
-   Safety AI
-   Voice processing

------------------------------------------------------------------------

# 23. Phase 15 --- Chat UI

The chat interface should look like a normal conversation.

``` text
Mitra                                      Telugu

Hi. How are you feeling today?

I've been stressed about exams.

That sounds like a difficult week.
Here are a few things that may help...

Sources
WHO · Stress management

[ 🎙 Hold to speak ]

Type a message...
```

Avoid:

``` text
✨ AI Insight
🤖 AI Magic
⚡ Powered by Gemini
```

on every response.

The AI should be behind the experience.

------------------------------------------------------------------------

# 24. Phase 16 --- Conversation History

Implement:

``` http
POST /api/v1/chat/conversations
GET  /api/v1/chat/history
GET  /api/v1/chat/:id
POST /api/v1/chat/:id/messages
DELETE /api/v1/chat/:id
```

UI:

``` text
Today
 └── Exam stress

Yesterday
 └── Trouble sleeping

Sept 23
 └── Feeling overwhelmed
```

------------------------------------------------------------------------

# 25. Phase 17 --- Multilingual Support

Supported languages:

``` text
English
Hindi
Telugu
Tamil
```

Store:

``` text
preferred_language
```

Each chat request contains:

``` json
{
  "message": "...",
  "language": "te"
}
```

Flow:

``` text
Selected language
      ↓
Safety
      ↓
Retrieval
      ↓
Gemini
      ↓
Response in selected language
```

The UI itself should also support language-aware labels where practical.

------------------------------------------------------------------------

# 26. Phase 18 --- Voice Interaction

Add a microphone button to the chat.

Flow:

``` text
User speaks
   ↓
Browser microphone
   ↓
Node
   ↓
FastAPI
   ↓
Sarvam ASR
   ↓
Text
   ↓
RAG + Gemini
   ↓
Sarvam TTS
   ↓
Audio
   ↓
Browser
```

The voice UI should remain simple:

``` text
🎙 Hold to speak
```

Do not create an elaborate animated voice interface.

------------------------------------------------------------------------

# 27. Phase 19 --- Safety Layer

Create:

``` text
ai-service/app/safety/
├── rules.py
├── classifier.py
└── pipeline.py
```

Risk categories:

``` text
NORMAL
DISTRESS
HIGH_CONCERN
CRISIS_SIGNAL
```

Pipeline:

``` text
User message
     ↓
Rule-based signals
     +
ML classifier
     +
Conversation context
     ↓
Safety engine
```

The LLM should not be the sole safety classifier.

------------------------------------------------------------------------

# 28. Phase 20 --- Safety Response

## NORMAL

Normal response.

## DISTRESS

Supportive response + relevant wellness resource.

## HIGH_CONCERN

Careful response + encourage appropriate human/professional support.

## CRISIS_SIGNAL

Show:

``` text
Immediate support guidance
Verified crisis/emergency resources
Encouragement to contact a trusted person/professional
```

Use verified and current crisis information. Do not allow the LLM to
invent helpline numbers.

------------------------------------------------------------------------

# 29. Phase 21 --- Wellness Library

Create:

``` text
/wellness
```

Categories:

``` text
Stress
Sleep
Focus
Breathing
Grounding
Study pressure
General wellbeing
```

Resource card:

``` text
Stress Management

5 minutes
Stress

Short description

[Start]
```

Use curated resources rather than having the LLM invent therapeutic
instructions.

------------------------------------------------------------------------

# 30. Phase 22 --- Resource Progress

When started:

``` text
started_at
```

When completed:

``` text
completed_at
status = COMPLETED
```

Track:

``` text
Activities completed
Activity time
Frequently used resources
```

------------------------------------------------------------------------

# 31. Phase 23 --- Recommendation Engine

Start with deterministic/content-based logic.

Example:

``` text
stress >= 7
    → stress-management resource

sleep <= 4
    → sleep resource

energy <= 4
    → rest/recovery resource
```

Inputs:

``` text
Latest check-ins
Resource history
Preferred language
Resource category
```

Later:

``` text
User-resource interactions
        ↓
Content similarity
        ↓
Personalized ranking
```

------------------------------------------------------------------------

# 32. Phase 24 --- Progress Dashboard

Page:

``` text
/progress
```

Display:

``` text
Mood
Stress
Sleep
Energy
Activities completed
```

Use Recharts.

Charts should be simple and readable.

Example:

``` text
Your progress

Last 7 days

Stress
──────╮
      ╰──────

Mood
────╮
    ╰────────

4 activities completed this week.
```

Avoid turning the application into a clinical analytics dashboard.

------------------------------------------------------------------------

# 33. Phase 25 --- Redis

Add Redis for meaningful use cases.

## Rate limiting

``` text
User
 ↓
API
 ↓
Redis
 ↓
Request counter
```

## Caching

Cache frequently requested non-sensitive data such as wellness
resources.

## Background jobs

Use Redis-backed queues for longer operations.

Do not cache private conversational content unnecessarily.

------------------------------------------------------------------------

# 34. Phase 26 --- Background Worker

Create:

``` text
worker/
```

Potential jobs:

``` text
voice_processing
document_processing
embedding_generation
analytics_processing
```

Flow:

``` text
Node
 ↓
Queue
 ↓
Worker
 ↓
AI service
 ↓
Result
```

This demonstrates asynchronous processing and automation.

------------------------------------------------------------------------

# 35. Phase 27 --- Security

Implement:

-   JWT authentication
-   bcrypt password hashing
-   Authorization middleware
-   Request validation
-   Rate limiting
-   CORS
-   Helmet
-   Secure headers
-   Environment variables
-   ORM/parameterized database operations
-   Input validation

Use a validation library such as Zod on the Node API.

Example:

``` text
stress_level → integer 1-10
energy_level → integer 1-10
sleep_quality → integer 1-10
```

Reject invalid requests.

------------------------------------------------------------------------

# 36. Phase 28 --- Privacy

Because wellness conversations may be sensitive:

Do:

``` text
Minimum data collection
Secure authentication
HTTPS
Access control
Minimal logging
Environment secrets
Data retention policy
```

Do not log:

``` text
Full sensitive conversation content
Raw microphone recordings
Passwords
API keys
```

------------------------------------------------------------------------

# 37. Phase 29 --- Testing

## Backend

Use:

``` text
Jest
Supertest
```

Test:

``` text
Registration
Login
JWT authentication
Chat API
Check-in API
Resource API
Recommendation API
Safety API
```

## Frontend

Use:

``` text
Jest
React Testing Library
```

Test:

``` text
Login
Dashboard
Chat
Check-in
Language selector
Resource card
Progress
```

## AI

Use:

``` text
Pytest
```

Test:

``` text
Retriever
Prompt construction
Safety rules
Safety classifier
Voice functions
```

------------------------------------------------------------------------

# 38. Phase 30 --- RAG Evaluation

Create:

``` text
tests/evaluation/
├── questions.json
├── expected_sources.json
└── results.json
```

Example:

``` json
{
  "question": "How can stress be managed?",
  "expected_topic": "stress",
  "expected_source": "WHO"
}
```

Evaluate:

``` text
Recall@K
Precision@K
Citation correctness
Groundedness
Hallucination rate
```

Document limitations.

------------------------------------------------------------------------

# 39. Phase 31 --- Safety Evaluation

Create a reviewed evaluation dataset containing:

``` text
NORMAL
DISTRESS
HIGH_CONCERN
CRISIS_SIGNAL
```

Measure:

``` text
Precision
Recall
F1
Confusion matrix
False negative rate
```

Do not claim perfect safety detection.

------------------------------------------------------------------------

# 40. Phase 32 --- Cypress E2E

Primary test:

``` text
Register
 ↓
Login
 ↓
Select Telugu
 ↓
Check-in
 ↓
Open Chat
 ↓
Send message
 ↓
Receive grounded response
 ↓
View source
 ↓
Open wellness activity
 ↓
Complete activity
 ↓
View progress
```

Voice test:

``` text
Login
 ↓
Voice input
 ↓
ASR
 ↓
AI response
 ↓
TTS
```

Safety test:

``` text
Predefined test case
 ↓
Safety classifier
 ↓
Support-resource flow
```

Use predefined test data for safety tests rather than real sensitive
conversations.

------------------------------------------------------------------------

# 41. Phase 33 --- Docker

Create containers for:

``` text
frontend
backend
ai-service
worker
redis
postgres
```

Local command:

``` bash
docker compose up --build
```

Every service should have a health check where practical.

------------------------------------------------------------------------

# 42. Phase 34 --- CI/CD

Create:

``` text
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

CI:

``` text
Push
 ↓
Install dependencies
 ↓
Lint
 ↓
Frontend tests
 ↓
Backend tests
 ↓
Python tests
 ↓
RAG evaluation
 ↓
Cypress
 ↓
Docker build
```

Deploy only after required checks succeed.

------------------------------------------------------------------------

# 43. Phase 35 --- Cloud Deployment

Initial deployment can use:

``` text
Frontend → frontend hosting
Backend → cloud service
AI service → cloud service
PostgreSQL → managed PostgreSQL
Redis → managed Redis
```

The exact providers can be selected later based on cost and
availability.

Use environment-specific secrets.

------------------------------------------------------------------------

# 44. Phase 36 --- Kubernetes

Only after the application is stable.

Deploy:

``` text
frontend
backend
ai-service
worker
```

Demonstrate:

``` bash
kubectl get pods
kubectl get services
kubectl scale deployment backend --replicas=3
```

Kubernetes is an advanced extension, not an MVP blocker.

------------------------------------------------------------------------

# 45. Phase 37 --- Monitoring

Track:

``` text
API latency
API error rate
RAG latency
Gemini latency
Voice processing latency
Request count
```

Structured log:

``` json
{
  "requestId": "abc123",
  "endpoint": "/api/v1/chat",
  "status": 200,
  "latencyMs": 1280
}
```

Do not log sensitive conversation content.

------------------------------------------------------------------------

# 46. API Design

Base:

``` text
/api/v1
```

## Authentication

``` http
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/logout
```

## Chat

``` http
POST /chat/conversations
GET  /chat/history
GET  /chat/:id
POST /chat/:id/messages
DELETE /chat/:id
```

## Check-ins

``` http
POST /checkins
GET  /checkins
GET  /checkins/summary
```

## Resources

``` http
GET  /resources
GET  /resources/:id
POST /resources/:id/start
POST /resources/:id/complete
```

## Progress

``` http
GET /progress
```

## Recommendations

``` http
GET /recommendations
```

## Voice

``` http
POST /voice/transcribe
POST /voice/synthesize
```

## Safety

``` http
POST /safety/analyze
```

------------------------------------------------------------------------

# 47. Environment Variables

Use:

``` text
.env
.env.example
```

Example:

``` env
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
SARVAM_API_KEY=
REDIS_URL=
AI_SERVICE_URL=
NODE_ENV=development
```

Never commit `.env`.

Commit only `.env.example`.

------------------------------------------------------------------------

# 48. Git Workflow

Use feature branches.

``` text
main
develop
feature/auth
feature/dashboard
feature/chat
feature/rag-api
feature/voice
feature/safety
feature/wellness
feature/testing
feature/docker
```

Example:

``` bash
git checkout -b feature/auth
git add .
git commit -m "feat: implement user authentication"
git push origin feature/auth
```

Use pull requests where practical.

------------------------------------------------------------------------

# 49. Development Roadmap

## Phase A --- Existing AI Migration

-   [ ] Backup current project
-   [ ] Inspect existing code
-   [ ] Create `ai-service`
-   [ ] Move/refactor RAG
-   [ ] Move/refactor voice
-   [ ] Create FastAPI application
-   [ ] `/health`
-   [ ] `/ai/chat`
-   [ ] `/ai/transcribe`
-   [ ] `/ai/synthesize`

### Milestone A

``` text
Standalone FastAPI AI service works.
```

------------------------------------------------------------------------

## Phase B --- Full-Stack Foundation

-   [ ] Create backend
-   [ ] Configure TypeScript
-   [ ] Configure Express
-   [ ] Configure Prisma
-   [ ] Create PostgreSQL database
-   [ ] Create schema
-   [ ] Authentication
-   [ ] JWT
-   [ ] Protected routes

### Milestone B

``` text
User can register, log in and access protected API routes.
```

------------------------------------------------------------------------

## Phase C --- Frontend

-   [ ] React + TypeScript
-   [ ] Tailwind
-   [ ] Redux
-   [ ] Routing
-   [ ] Landing page
-   [ ] Login
-   [ ] Register
-   [ ] Dashboard
-   [ ] Profile

### Milestone C

``` text
User can use the application through the browser.
```

------------------------------------------------------------------------

## Phase D --- Core Product

-   [ ] Check-in
-   [ ] Chat
-   [ ] Conversation history
-   [ ] RAG integration
-   [ ] Source display
-   [ ] Multilingual UI
-   [ ] Voice

### Milestone D

``` text
React → Node → FastAPI → RAG/Gemini/Sarvam works end-to-end.
```

------------------------------------------------------------------------

## Phase E --- Wellness

-   [ ] Resource library
-   [ ] Resource filtering
-   [ ] Resource progress
-   [ ] Recommendations
-   [ ] Progress charts

### Milestone E

``` text
Check-in → recommendation → activity → progress.
```

------------------------------------------------------------------------

## Phase F --- Safety

-   [ ] Safety categories
-   [ ] Rules
-   [ ] Classifier
-   [ ] Context handling
-   [ ] Safety API
-   [ ] Verified support resources
-   [ ] Safety evaluation

### Milestone F

``` text
Safety layer operates independently of normal RAG generation.
```

------------------------------------------------------------------------

## Phase G --- Engineering

-   [ ] Redis
-   [ ] Background worker
-   [ ] Structured logging
-   [ ] API validation
-   [ ] Rate limiting
-   [ ] Security middleware

------------------------------------------------------------------------

## Phase H --- Testing

-   [ ] Jest
-   [ ] Supertest
-   [ ] React Testing Library
-   [ ] Pytest
-   [ ] RAG evaluation
-   [ ] Safety evaluation
-   [ ] Cypress

------------------------------------------------------------------------

## Phase I --- DevOps

-   [ ] Docker
-   [ ] Docker Compose
-   [ ] GitHub Actions
-   [ ] Cloud deployment
-   [ ] Production configuration
-   [ ] Monitoring

------------------------------------------------------------------------

## Phase J --- Advanced

-   [ ] Kubernetes
-   [ ] Admin dashboard
-   [ ] Advanced recommendation engine
-   [ ] Autoscaling
-   [ ] Advanced observability

------------------------------------------------------------------------

# 50. MVP Definition

The first complete MVP must contain:

``` text
✓ React website
✓ Node.js backend
✓ PostgreSQL
✓ Authentication
✓ Dashboard
✓ Daily check-in
✓ Chat
✓ Existing RAG
✓ Gemini
✓ Source citations
```

Do not start advanced infrastructure until this works.

------------------------------------------------------------------------

# 51. Version 2

Add:

``` text
✓ Hindi
✓ Telugu
✓ Tamil
✓ Sarvam ASR
✓ Sarvam TTS
✓ Wellness resources
✓ Resource progress
✓ Progress charts
```

------------------------------------------------------------------------

# 52. Version 3

Add:

``` text
✓ Safety engine
✓ Recommendations
✓ Redis
✓ Background worker
✓ Structured logging
```

------------------------------------------------------------------------

# 53. Version 4

Add:

``` text
✓ Jest
✓ Supertest
✓ Pytest
✓ Cypress
✓ Docker
✓ GitHub Actions
✓ Cloud deployment
✓ Monitoring
```

------------------------------------------------------------------------

# 54. Optional Advanced Version

``` text
✓ Kubernetes
✓ Admin dashboard
✓ Advanced recommendation model
✓ Autoscaling
✓ Advanced observability
```

------------------------------------------------------------------------

# 55. Final User Journey

The final product should demonstrate one coherent workflow:

``` text
                    MITRAMIND
                        │
                        ▼
                  Registration
                        │
                        ▼
                     Login
                        │
                        ▼
                Select language
                        │
                        ▼
                   Dashboard
                        │
                        ▼
                  Daily check-in
                        │
                        ▼
                  Recommendation
                        │
                        ▼
                  Talk to Mitra
                        │
                        ▼
                 Safety screening
                        │
                        ▼
                    RAG search
                        │
                        ▼
                     FAISS
                        │
                        ▼
                     Gemini
                        │
                        ▼
               Grounded response
                        │
                        ▼
                     Sources
                        │
                        ▼
                 Wellness activity
                        │
                        ▼
                  Progress update
                        │
                        ▼
                 Voice interaction
                        │
                        ▼
                Safety-aware flow
                        │
                        ▼
                  Automated tests
                        │
                        ▼
                      Docker
                        │
                        ▼
                 GitHub Actions
                        │
                        ▼
                     Cloud
```

------------------------------------------------------------------------

# 56. Final Demo Plan

The final demonstration should NOT be:

> "Here is my chatbot."

Instead:

## Demo 1 --- Product

Open the landing page and show the clean UI.

## Demo 2 --- Authentication

Register and log in.

## Demo 3 --- Check-in

Enter a sample wellness check-in.

## Demo 4 --- Recommendation

Show a relevant resource recommendation.

## Demo 5 --- RAG

Ask a wellness-related question.

Show:

``` text
Answer
Source
Recommended resource
```

## Demo 6 --- Multilingual

Switch to Telugu/Hindi/Tamil.

## Demo 7 --- Voice

Speak through the microphone and receive spoken output.

## Demo 8 --- Progress

Complete an activity and show the progress dashboard.

## Demo 9 --- Safety

Use a predefined safety evaluation case and demonstrate the appropriate
support-resource flow.

## Demo 10 --- Engineering

Show:

``` text
GitHub
 ↓
Tests
 ↓
Docker
 ↓
GitHub Actions
 ↓
Deployment
```

------------------------------------------------------------------------

# 57. Final Project Story

The final explanation should be:

> "I initially built MitraMind as a Python-based RAG and voice
> prototype. I then redesigned it as a full-stack platform instead of
> keeping it as a standalone AI application. I separated the AI
> workloads into a FastAPI service and built a Node.js/Express API layer
> for authentication, persistence and business logic. The React frontend
> communicates with the backend through REST APIs, while PostgreSQL
> stores users, conversations, check-ins and wellness activity. The
> existing FAISS-based RAG and Sarvam voice modules became reusable AI
> services. I then added multilingual support, safety-aware
> classification, personalized wellness recommendations, automated
> testing, Docker and CI/CD."

------------------------------------------------------------------------

# 58. Final Technology Map

  Area                     Technology
  ------------------------ ------------------------
  Frontend                 React + TypeScript
  UI                       Tailwind CSS
  State                    Redux Toolkit
  Routing                  React Router
  Charts                   Recharts
  Backend                  Node.js + Express
  Backend language         TypeScript
  Database                 PostgreSQL
  ORM                      Prisma
  AI API                   FastAPI
  RAG                      LangChain + FAISS
  LLM                      Gemini
  Voice                    Sarvam AI
  Cache                    Redis
  Background jobs          Redis-backed worker
  Unit testing             Jest / Pytest
  API testing              Supertest
  E2E                      Cypress
  Containers               Docker
  CI/CD                    GitHub Actions
  Cloud                    Managed cloud services
  Advanced orchestration   Kubernetes

------------------------------------------------------------------------

# 59. Final Definition of Done

MitraMind is complete when all of the following work:

``` text
[ ] User can register
[ ] User can log in
[ ] User can select language
[ ] User can complete a daily check-in
[ ] User can start a conversation
[ ] Node backend authenticates the request
[ ] Node calls FastAPI
[ ] FastAPI performs safety screening
[ ] FastAPI performs RAG retrieval
[ ] FAISS retrieves relevant context
[ ] Gemini generates grounded response
[ ] Sources are displayed
[ ] Conversation is stored
[ ] User can view history
[ ] User can use Hindi
[ ] User can use Telugu
[ ] User can use Tamil
[ ] User can use voice input
[ ] User can hear voice output
[ ] User can browse wellness resources
[ ] User can complete resources
[ ] User receives personalized recommendations
[ ] User can view progress
[ ] Safety layer handles predefined test cases
[ ] Backend has automated tests
[ ] Frontend has automated tests
[ ] AI service has automated tests
[ ] RAG has evaluation tests
[ ] Safety has evaluation tests
[ ] Cypress E2E workflow passes
[ ] Application runs with Docker
[ ] GitHub Actions runs CI
[ ] Application is deployed
[ ] Secrets are not committed
[ ] Sensitive information is not unnecessarily logged
[ ] UI is responsive
[ ] UI remains simple and human-designed
```

------------------------------------------------------------------------

# 60. Most Important Implementation Rule

Do not build all features simultaneously.

Follow this exact order:

``` text
1. Preserve existing AI project
          ↓
2. FastAPI AI service
          ↓
3. /ai/chat
          ↓
4. /ai/transcribe
          ↓
5. /ai/synthesize
          ↓
6. Node + Express
          ↓
7. PostgreSQL + Prisma
          ↓
8. Authentication
          ↓
9. React frontend
          ↓
10. Dashboard
          ↓
11. Check-ins
          ↓
12. Connect React → Node → FastAPI
          ↓
13. Chat history
          ↓
14. Multilingual
          ↓
15. Voice UI
          ↓
16. Safety
          ↓
17. Wellness
          ↓
18. Recommendations
          ↓
19. Progress
          ↓
20. Redis
          ↓
21. Background jobs
          ↓
22. Testing
          ↓
23. RAG evaluation
          ↓
24. Safety evaluation
          ↓
25. Docker
          ↓
26. GitHub Actions
          ↓
27. Cloud
          ↓
28. Kubernetes / monitoring
```

**The first real milestone is not Kubernetes, Redis, or a fancy UI.**

It is:

``` text
React
  ↓
Node
  ↓
FastAPI
  ↓
YOUR EXISTING RAG
  ↓
Gemini
  ↓
Response + Source
  ↓
React
```

Once that works, you have successfully transformed your existing
MitraMind AI prototype into the foundation of a full-stack product.
