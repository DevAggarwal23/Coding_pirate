# SIH26092 — Backend Implementation Plan
### Thinking Like an SIH Judge

---

## What Judges Actually Evaluate

> [!IMPORTANT]
> SIH judges are NOT looking for a "nice app". They look for:
> 1. **Does it actually solve the real problem?** (not just look good)
> 2. **Is the AI doing real work?** (not just if-else conditions)
> 3. **Can it scale to real deployment?** (not just localhost demo)
> 4. **Is the architecture sound?** (modular, clean, production-ready thinking)
> 5. **Does the team understand what they built?** (can answer deep technical questions)

---

## Judge's Red Flags (What LOSES SIH)

> [!CAUTION]
> - Backend that does keyword search and calls it "AI matching"
> - No real database — data hardcoded in Python arrays
> - No input validation — crashes on unexpected input
> - Voice input that doesn't actually transcribe — just a button
> - No error handling — works only on the happy path
> - Single endpoint that does everything (monolith logic)

---

## Winning Backend Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
│           React App  |  IVR/Phone  |  WhatsApp Bot            │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTPS REST / WebSocket (voice streaming)
┌──────────────▼───────────────────────────────────────────────┐
│                   API GATEWAY (FastAPI)                        │
│     Rate Limiting | Validation | CORS | Error Handling        │
└──┬────────────┬───────────────┬──────────────┬───────────────┘
   │            │               │              │
┌──▼──┐    ┌───▼───┐      ┌────▼────┐    ┌────▼────┐
│Voice│    │Profile│      │ Scheme  │    │ Status  │
│ API │    │  API  │      │Match API│    │Track API│
└──┬──┘    └───┬───┘      └────┬────┘    └────┬────┘
   │            │               │              │
┌──▼────────────▼───────────────▼──────────────▼──────────────┐
│                      SERVICE LAYER                            │
│  VoiceService | NLPService | MatcherService | OCRService      │
└──┬─────────────┬─────────────┬────────────────────────────────┘
   │             │             │
┌──▼────┐  ┌────▼────┐  ┌─────▼──────────────────────────────┐
│Whisper│  │ spaCy   │  │      AI MATCHING ENGINE             │
│  /    │  │  NER    │  │  Sentence-transformers + FAISS      │
│Bhash- │  │Extractor│  │  Cosine Similarity + Confidence     │
│ ini   │  └─────────┘  └─────────────────────────────────────┘
└───────┘                           │
                           ┌────────▼──────────────────────────┐
                           │         DATA LAYER                 │
                           │  PostgreSQL (schemes + profiles)   │
                           │  FAISS Index (vector embeddings)   │
                           └───────────────────────────────────┘
```

---

## Backend Folder Structure

```
backend/
├── main.py                  ← FastAPI app, all routers registered here
├── requirements.txt
├── .env                     ← DB URL, API keys (never commit this)
├── .env.example             ← template for teammates
│
├── core/
│   ├── config.py            ← all settings loaded from .env
│   ├── database.py          ← PostgreSQL async connection pool
│   └── dependencies.py      ← get_db(), get_current_user() etc.
│
├── models/                  ← SQLAlchemy ORM models
│   ├── scheme.py
│   ├── user_profile.py
│   └── application.py
│
├── schemas/                 ← Pydantic request/response shapes
│   ├── scheme.py
│   ├── profile.py
│   ├── matching.py
│   └── voice.py
│
├── routers/                 ← One file per feature
│   ├── voice.py             ← POST /api/voice/transcribe
│   ├── profile.py           ← POST /api/profile/extract
│   ├── matching.py          ← POST /api/match/schemes
│   ├── ocr.py               ← POST /api/ocr/verify
│   └── status.py            ← GET  /api/applications/{id}
│
├── services/                ← Business logic, no HTTP here
│   ├── voice_service.py     ← Whisper/Bhashini transcription
│   ├── nlp_service.py       ← spaCy NER entity extraction
│   ├── matcher_service.py   ← FAISS + scoring logic
│   ├── ocr_service.py       ← Tesseract verification
│   └── scheme_service.py    ← Scheme CRUD operations
│
├── ai_engine/               ← Pure AI/ML code, no HTTP
│   ├── embedder.py          ← load model, encode text → vector
│   ├── faiss_index.py       ← build / load / search FAISS index
│   └── confidence.py        ← scoring formula
│
├── data/
│   ├── schemes.json         ← 20-30 real schemes seed data
│   └── seed_db.py           ← one-time script to load DB
│
└── tests/
    ├── test_matching.py
    ├── test_voice.py
    └── test_ocr.py
```

---

## All 6 API Endpoints — Detailed Design

### 1. `POST /api/voice/transcribe`
**Purpose:** Convert audio file → Hindi/English transcript
```json
// Input: multipart/form-data
{ "audio": <file.webm>, "language": "hi" }

// Output:
{
  "transcript": "मेरी दर्जी की दुकान है SC category हूँ इनकम डेढ़ लाख है बिहार में",
  "language_detected": "hi",
  "confidence": 0.94,
  "processing_time_ms": 1820
}
```
> **Judge impact:** Real audio processing. Not just a mic button that does nothing.

---

### 2. `POST /api/profile/extract`
**Purpose:** NLP extracts structured profile from raw text (voice transcript OR typed text — same endpoint)
```json
// Input:
{
  "text": "मेरी दर्जी की दुकान है SC category हूँ इनकम डेढ़ लाख है बिहार में"
}

// Output:
{
  "extracted": {
    "category": "SC",
    "income": 150000,
    "state": "Bihar",
    "business_type": "tailoring",
    "project_cost": null
  },
  "confidence": 0.88,
  "missing_fields": ["project_cost"],
  "follow_up_question": "आपके प्रोजेक्ट की अनुमानित लागत क्या है?"
}
```
> **Judge impact:** `missing_fields` + `follow_up_question` = conversational AI, not a dumb form. Judges love this.

---

### 3. `POST /api/match/schemes` ⭐ Core Feature
**Purpose:** AI matches user profile to eligible schemes
```json
// Input:
{
  "category": "SC",
  "income": 150000,
  "state": "Bihar",
  "business_type": "tailoring",
  "project_cost": null
}

// Output:
{
  "auto_matched": [
    {
      "scheme_id": "standup-india",
      "scheme_name": "Stand-Up India",
      "confidence": 0.91,
      "benefit": "₹10L - ₹1Cr loan at concessional rate",
      "documents_required": ["Caste Certificate", "Income Proof", "Business Plan"],
      "application_link": "https://www.standupmitra.in",
      "why_matched": "SC category ✓  |  Business loan eligible ✓  |  No income ceiling ✓"
    }
  ],
  "borderline": [
    {
      "scheme_id": "pm-daksh",
      "scheme_name": "PM-DAKSH",
      "confidence": 0.71,
      "reason": "Skill training scheme — check if applicable to your business"
    }
  ],
  "not_eligible": [
    {
      "scheme_id": "nmdfc-loan",
      "scheme_name": "NMDFC Loan",
      "reason": "This scheme is for Minority communities only (OBC/Muslim/Christian)"
    }
  ],
  "total_schemes_checked": 28,
  "processing_time_ms": 247
}
```
> **Judge impact:** `why_matched` shows the AI is explainable. `not_eligible` with reason shows honesty — no system hides this. `borderline` with explanation shows real intelligence.

---

### 4. `POST /api/ocr/verify`
**Purpose:** Verify uploaded certificate is valid and readable
```json
// Input: multipart/form-data
{ "document": <image.jpg>, "document_type": "caste_certificate" }

// Output:
{
  "is_valid": true,
  "extracted_name": "Ramesh Kumar",
  "extracted_category": "SC",
  "issuing_authority": "District Collector, Patna",
  "image_quality": "good",
  "issues": [],
  "confidence": 0.87
}

// If blurry image:
{
  "is_valid": false,
  "image_quality": "blurry",
  "issues": ["Image too blurry to read"],
  "suggestion": "Please retake the photo in good lighting"
}
```

---

### 5. `POST /api/applications/submit` + `GET /api/applications/{id}/status`
```json
// Submit Output:
{
  "application_id": "APP-2026-00142",
  "scheme_name": "Stand-Up India",
  "status": "submitted",
  "submitted_at": "2026-09-09T17:30:00+05:30",
  "next_step": "Visit nearest SBI/PNB/Bank of Baroda branch with documents",
  "estimated_processing": "15-30 working days"
}

// Status Output:
{
  "application_id": "APP-2026-00142",
  "current_status": "under_review",
  "timeline": [
    { "stage": "submitted",    "at": "2026-09-09T17:30:00" },
    { "stage": "under_review", "at": "2026-09-10T09:00:00" }
  ]
}
```

---

### 6. Health + Stats (Judges Check This During Demo)
```json
// GET /api/health
{ "status": "ok", "db": "connected", "faiss_index": "loaded", "schemes_indexed": 28 }

// GET /api/stats
{
  "total_matches_today": 142,
  "avg_response_time_ms": 234,
  "top_matched_schemes": ["Stand-Up India", "PM-DAKSH", "PMEGP"],
  "languages_used": { "hi": 89, "en": 31, "ta": 22 }
}
```
> **Judge impact:** A live `/health` endpoint during demo shows production-ready thinking. Most student teams don't have this.

---

## AI Matching — The Technical Core

### How It Actually Works (Be Ready to Explain This)
```
── OFFLINE (One-time, runs on server start) ──────────────────
1. Load 28 schemes from PostgreSQL
2. For each scheme → encode eligibility_text → 384-dim float vector
   using: sentence-transformers/all-MiniLM-L6-v2
3. Stack all vectors into FAISS IndexFlatIP (cosine similarity)
4. Save index to disk as scheme_vectors.index

── ONLINE (Per request, target <300ms) ──────────────────────
1. Build user query string from profile:
   "SC category, tailoring business, income 150000 rupees, Bihar state"
2. Encode query → 384-dim vector (same model, loaded in memory)
3. FAISS.search(query_vec, k=10) → top 10 distances + scheme IDs
4. Apply hard eligibility rules (income > max_income → discard)
5. Map distances → confidence scores (0.0 to 1.0)
6. Classify: >0.85 → auto_matched | 0.6-0.85 → borderline | <0.6 → not_matched
7. Return ranked, explained results
```

### Confidence Scoring Formula
```python
def compute_confidence(semantic_score, user, scheme):
    hard_rules_pass = (
        user.category in scheme.categories and
        (scheme.max_income is None or user.income <= scheme.max_income) and
        (scheme.eligible_states is None or user.state in scheme.eligible_states)
    )
    
    if not hard_rules_pass:
        return 0.0  # hard disqualification, show in not_eligible
    
    # Semantic score from FAISS (0 to 1, higher = more similar)
    # Blend: 70% semantic, 30% hard-rule bonus
    confidence = (semantic_score * 0.70) + (0.30 if hard_rules_pass else 0.0)
    return min(confidence, 0.98)  # never claim 100% certainty
```

---

## Voice + Text — One Unified Pipeline

> [!NOTE]
> Both voice and text go through **identical backend logic**.
> The frontend just handles collection differently.

```
Text typed by user
        │
        ▼
POST /api/profile/extract ──► NLP Entity Extraction ──► Profile Dict
                                                              │
                                                              ▼
Voice spoken by user                              POST /api/match/schemes
        │                                                     │
        ▼                                                     ▼
POST /api/voice/transcribe                           AI Results Returned
        │ (returns text)
        ▼
POST /api/profile/extract ──► same NLP ──► same Profile Dict ──► same Results
```

**Both paths merge at `profile dict` → same matching engine.**

---

## Database Schema

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Schemes (core data)
CREATE TABLE schemes (
    scheme_id       VARCHAR(100) PRIMARY KEY,
    scheme_name     TEXT NOT NULL,
    ministry        TEXT,
    categories      TEXT[],          -- {SC, ST, OBC, Women, Minorities}
    max_income      INTEGER,         -- annual, INR (NULL = no ceiling)
    eligible_states TEXT[],          -- NULL = pan-India
    business_types  TEXT[],          -- NULL = all business types
    benefit_amount  TEXT,
    documents_req   TEXT[],
    application_url TEXT,
    eligibility_text TEXT,           -- full natural language text for AI
    embedding       VECTOR(384),     -- pgvector column for prod
    last_verified   TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

-- User profiles (privacy-first: minimal data)
CREATE TABLE user_profiles (
    profile_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_hash      TEXT UNIQUE,     -- hashed phone, NOT plain number (DPDP Act)
    category        TEXT,
    income          INTEGER,
    state           TEXT,
    business_type   TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Application tracking
CREATE TABLE applications (
    application_id  VARCHAR(20) PRIMARY KEY,  -- APP-2026-XXXXX
    profile_id      UUID REFERENCES user_profiles(profile_id),
    scheme_id       VARCHAR(100) REFERENCES schemes(scheme_id),
    status          TEXT DEFAULT 'submitted' CHECK (
                        status IN ('submitted','under_review','approved','rejected')
                    ),
    submitted_at    TIMESTAMP DEFAULT NOW(),
    last_updated    TIMESTAMP DEFAULT NOW()
);
```

---

## Open Questions — Team Must Decide Before Coding

> [!IMPORTANT]
> **Decide these NOW before building, or you'll rebuild:**
>
> 1. **NLP for Hindi extraction?**
>    - `spaCy hi_core_news_sm` (accurate, 50MB model download)
>    - vs `regex patterns` (fast, easy to debug for demo)
>    - ✅ **Recommended: regex for MVP demo, spaCy comment in code for future**
>
> 2. **FAISS vs pgvector?**
>    - FAISS: blazing fast in-memory search, separate .index file
>    - pgvector: slower, but integrated in PostgreSQL, always persistent
>    - ✅ **Recommended: FAISS for demo speed, pgvector flag in README for prod**
>
> 3. **Whisper model size?**
>    - `tiny` — 39MB, fastest, less accurate
>    - `base` — 74MB, balanced ← ✅ **Recommended**
>    - `small` — 244MB, most accurate, slow on CPU
>
> 4. **Auth / user identity?**
>    - Phone number for status tracking?
>    - Store hashed phone only (DPDP Act 2023 compliance)
>    - ✅ **Recommended: hash phone with SHA-256 before storing**

---

## Why This Backend Wins SIH

| Criterion | How This Backend Scores |
|-----------|------------------------|
| **Technical Depth** | Real FAISS vector search, not keyword filter |
| **Explainability** | `why_matched` field — AI reasoning is visible |
| **Scalability** | Stateless API, FAISS loaded once in memory |
| **Innovation** | Voice → NLP → AI in one pipeline, zero form filling |
| **Production Ready** | `/health`, `/stats`, error handling, validation |
| **Accessibility** | Same API serves App + IVR + WhatsApp — any channel |
| **Privacy** | Phone hashed, minimal data retention — DPDP compliant |

---

## Verification Plan

### Test Cases (Must Pass Before Demo)
| Test | Input | Expected Output |
|------|-------|----------------|
| SC user, low income, Bihar | category=SC, income=150000 | Stand-Up India in auto_matched |
| General user, high income | category=GEN, income=1000000 | SC-only schemes in not_eligible |
| Hindi voice "मेरी दर्जी की दुकान" | audio file | business_type=tailoring extracted |
| Blurry document photo | low-res image | `image_quality: blurry`, no crash |
| Missing income field | income=null | `missing_fields: ["income"]`, 422 not 500 |
| Invalid category value | category="xyz" | Validation error, 422 |

### Commands
```bash
# Install & run
cd backend
pip install -r requirements.txt
python data/seed_db.py              # load schemes into DB
python ai_engine/faiss_index.py     # build FAISS index
uvicorn main:app --reload           # start server

# Test
pytest tests/ -v                    # unit tests
curl http://localhost:8000/api/health  # should return {"status":"ok"}
```
