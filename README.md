# AI Interview Agent

Personalized, multi-turn technical interviews for graduates of the **AI Cohort · 31 days · 8 modules**.

The agent uses each candidate’s mission history, learning signals, and the cohort curriculum (via RAG) to run a realistic interview—then returns structured, actionable feedback.

---

## Problem

After the cohort, learners can build RAG systems, agents, MCP tools, and production deployments—but **explaining those systems in interviews** is still hard.

This project closes that gap with an interviewer that:

- Assesses concepts the candidate actually completed
- Adapts with intelligent follow-ups
- Keeps full conversation context
- Ends with clear strengths, gaps, and next steps

---

## What it does

| Requirement | How we meet it |
|-------------|----------------|
| Conversational technical interview | Multi-turn agent over `POST /api/interview` |
| ≥ 8 questions across ≥ 4 curriculum days | Session planner grounded in completed missions + curriculum |
| Follow-ups from prior answers | Agent reasons over chat history + retrieved curriculum chunks |
| Conversation context | In-memory session store keyed by `sessionId` |
| Structured end feedback | `{ summary, strengths, gaps, next }` when `done: true` |
| Required HTTP contract | Spec-compliant `/api/interview` |

---

## Architecture

```
┌─────────────┐     POST /api/interview      ┌──────────────────┐
│   Frontend  │ ───────────────────────────► │  FastAPI Agent   │
│  (next)     │ ◄─────────────────────────── │  Interviewer     │
└─────────────┘     reply / feedback         └────────┬─────────┘
                                                      │
                         ┌────────────────────────────┼────────────────────────────┐
                         ▼                            ▼                            ▼
                  ┌─────────────┐            ┌────────────────┐            ┌──────────────┐
                  │  Session    │            │  RAG Retriever │            │  LLM         │
                  │  Store      │            │  (ChromaDB)    │            │  (Gemini)    │
                  └─────────────┘            └───────┬────────┘            └──────────────┘
                                                     │
                              ┌──────────────────────┴──────────────────────┐
                              ▼                                             ▼
                     curriculum.json                              candidates.json
                     (31 days / objectives / tools)               (missions / signals)
```

### RAG knowledge base

We chunk and embed two sources:

1. **`curriculum.json`** — modules, daily topics, learning objectives, tools  
2. **`candidates.json`** — per-candidate profile, mission outcomes, skip/attempt signals  

At interview start, retrieval is **personalized**: completed/skipped days and weak attempts bias which curriculum chunks are pulled into the interviewer prompt.

---

## Data

| File | Role |
|------|------|
| [`curriculum.json`](./curriculum.json) | 8 modules, 31 days — titles, types, tools, objectives |
| [`candidates.json`](./candidates.json) | 20 synthetic candidate profiles |
| [`technical-spec (1).md`](./technical-spec%20(1).md) | API contract & feedback schema |

### Candidate shape (summary)

```json
{
  "member": {
    "id": "CAND-001",
    "name": "Sarah Johnson",
    "jobRole": "Senior Data Engineer",
    "yearsExperience": 9,
    "education": "MS Computer Science",
    "status": "COMPLETED"
  },
  "missions": [
    { "day": 7, "title": "Embeddings Explained", "passed": true, "attempts": 1 }
  ],
  "signals": {
    "commitDays": 28,
    "missionsCompleted": 30,
    "missionsFirstTry": 20
  }
}
```

---

## API contract

Single endpoint, no auth. State is keyed by `sessionId`.

### 1. Start interview

```http
POST /api/interview
Content-Type: application/json

{
  "sessionId": "abc-123",
  "candidate": { "...full candidate object..." }
}
```

```json
{
  "reply": "Welcome. Let's begin your interview.",
  "done": false
}
```

### 2. Conversation turn

```json
{
  "sessionId": "abc-123",
  "message": "I used ChromaDB with sentence-transformers for embeddings..."
}
```

```json
{
  "reply": "How did you evaluate retrieval quality?",
  "done": false
}
```

### 3. End interview

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

---

## Project layout

```
sole_agent/
├── README.md
├── curriculum.json
├── candidates.json
├── technical-spec (1).md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py              # FastAPI + /api/interview
│       ├── config.py
│       ├── rag/
│       │   ├── ingest.py        # Chunk + index curriculum & candidates
│       │   ├── retriever.py     # Personalized retrieval
│       │   └── store.py         # ChromaDB wrapper
│       └── agent/
│           ├── interviewer.py   # Interview orchestration
│           ├── planner.py       # Day/topic coverage (≥4 days, ≥8 Qs)
│           └── session.py       # In-memory session state
└── frontend/                    # Coming next
```

---

## Quick start

### Prerequisites

- Python 3.11+
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # set GEMINI_API_KEY
```

Ingest curriculum + candidates into Chroma:

```bash
python -m app.rag.ingest
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health)

Smoke-test an interview start:

```bash
curl -s http://localhost:8000/api/interview \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{
  "sessionId": "demo-1",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9,
      "education": "MS Computer Science",
      "status": "COMPLETED"
    },
    "missions": [
      { "day": 7, "title": "Embeddings Explained", "passed": true, "attempts": 1 },
      { "day": 8, "title": "Vector Databases Overview", "passed": true, "attempts": 1 },
      { "day": 10, "title": "Retrieval & Matching Engine", "passed": true, "attempts": 2 },
      { "day": 23, "title": "Model Context Protocol (MCP)", "passed": true, "attempts": 2 }
    ],
    "signals": { "commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20 }
  }
}
EOF
```

---

## Interview design (agent behavior)

1. **Plan** — From missions/signals, pick ≥ 4 distinct curriculum days (prefer completed; probe high-attempt / skipped topics carefully).
2. **Retrieve** — Pull matching curriculum objectives/tools via RAG for each planned day.
3. **Interview** — Ask ≥ 8 questions with natural follow-ups; stay conversational, not a quiz form.
4. **Close** — Produce structured feedback: summary, strengths, gaps, next steps.

Topics covered in the cohort (and fair game in interviews): RAG, vector DBs, prompt engineering, agentic AI, MCP, deployment, and production systems.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| API | FastAPI |
| Vector store | ChromaDB |
| Embeddings | Sentence Transformers (local) |
| LLM | Google Gemini (`gemini-2.0-flash`) |
| Frontend | TBD (next milestone) |

---

## Hackathon submission checklist

- [ ] Public GitHub repository
- [ ] Live demo URL (backend + frontend)
- [ ] `PROMPTS.md` (AI usage log)
- [ ] Spec-compliant `POST /api/interview`
- [ ] ≥ 8 questions, ≥ 4 curriculum days, structured feedback

---

## Out of scope

Voice, auth, persistent accounts, long-term history, and mobile apps are intentionally not required.

---

## License

Hackathon submission — synthetic curriculum and candidate data provided for the challenge only.
