# 🚀 Scheme Saathi

### AI-Driven Scheme Matching for Marginalized Entrepreneurs

| Metric / Parameter | Value |
| :--- | :--- |
| **SIH Problem Statement** | **SIH26092** |
| **Organization** | **Ministry of Social Justice and Empowerment (MoSJE)** |
| **Department** | **Department of Social Justice and Empowerment** |
| **Theme** | **Smart Automation** |
| **Category** | **Software** |
| **Core Value Proposition** | *"Don't just find a scheme. Find the right financial path."* |
| **🌐 Live Web Application (Frontend)** | **[https://coding-pirate.vercel.app](https://coding-pirate.vercel.app)** *(Deployed on Vercel)* |
| **⚡ Live API Service (Backend)** | **[https://coding-pirate.onrender.com](https://coding-pirate.onrender.com)** *(Deployed on Render)* |
| **📖 Interactive API Docs** | **[https://coding-pirate.onrender.com/docs](https://coding-pirate.onrender.com/docs)** *(Swagger UI)* |

---

Scheme Saathi is an AI-assisted GovTech platform that converts a beneficiary's natural-language financial need into an explainable scheme recommendation, financial analysis, document readiness, intelligent Channel Partner routing, and application tracking workflow.

---

## 🧭 2. Project Vision

Government welfare and concessional financing schemes are historically difficult to discover and navigate. Marginalized entrepreneurs, artisans, women, and small-scale business owners frequently encounter critical hurdles:
- **Discovery Bottleneck:** Beneficiaries do not know which specific scheme aligns with their trade or demographic category.
- **Ambiguous Eligibility:** Hard criteria (annual family income caps, state boundaries, community certificates) are buried in dense regulatory notifications.
- **Financial Uncertainty:** Applicants cannot determine the viable loan quantum, repayment tenure, or applicable interest subsidy.
- **Document Disqualification:** Applications are rejected due to missing, incorrectly formatted, or incomplete mandatory records.
- **Channel Partner Routing Deficit:** Beneficiaries are unaware of which local Lead District Bank, State SC/ST/OBC Development Corporation, or District Industries Centre (DIC) is authorized to disburse funds.
- **Lack of Tracking & Guidance:** Applicants lack transparency once paperwork is handed over.

### Scheme Saathi End-to-End Architectural Approach

```
Natural Need
    ↓
AI Understanding
    ↓
Eligibility Engine
    ↓
Scheme Matching
    ↓
Financial Analysis
    ↓
Document Readiness
    ↓
Partner Routing
    ↓
Application Filing
    ↓
Status Tracking
```

---

## ⚡ 3. Why Scheme Saathi?

### Comparison of User Experience

| Phase | Traditional Citizen Experience | Scheme Saathi Experience |
| :--- | :--- | :--- |
| **Input & Query** | Citizen browses disparate portals and PDF booklets. | Citizen speaks or types natural need in native language. |
| **Profile Extraction** | Manual self-classification across confusing categories. | AI extracts demographic, income, and business profile. |
| **Eligibility Assessment** | Citizen reads complex criteria without certainty. | Deterministic rules run hard filter checks with clear reasoning. |
| **Scheme Matching** | Keyword search yielding hundreds of unrelated schemes. | Semantic vector search + explainable **Recommendation Match Score**. |
| **Financial Assessment** | Separate calculation or reliance on local middlemen. | Integrated EMI calculator, interest breakdown, and What-If simulation. |
| **Document Checklist** | Discovers missing documents only at bank counter rejection. | Scheme-specific document checklist, OCR quality check, and readiness score. |
| **Channel Discovery** | Visits arbitrary branches with no category specialization. | Geo-spatial channel partner routing with approximate distance corridors. |
| **Lifecycle Tracking** | Unrecorded handoffs with no visibility into status. | Permanent Application ID, audit timeline, and stage tracking. |

> **Core USP:** *"From Scheme Discovery to Financing Readiness & Channel Routing."*

---

## ✨ 4. Key Features (Verified Implementation)

### 🗣️ Voice-First Interaction
- **Browser Audio Capture:** Real-time audio recording via MediaRecorder API (`audio/webm`, `audio/wav`).
- **Real Audio Processing:** Audio stream dispatched to `POST /api/voice/transcribe`.
- **Bhashini Integration:** Configured to invoke official Bhashini ASR pipelines (`POST /api/bhashini/asr`) when API credentials are provided.
- **Configured Fallback:** Local Whisper (`openai-whisper` base/tiny models) and browser SpeechRecognition API fallbacks ensure voice flow operates reliably even during connectivity interruptions.

### 🧠 Multilingual NLP Entity Extraction
- **Supported Languages:** Hindi (हिन्दी), Hinglish, English, Bengali (বাংলা), Tamil (தமிழ்), Marathi (मराठी), Telugu (తెలుగు).
- **Entity Extraction Engine (`POST /api/profile/extract`):**
  - **Social Category:** SC, ST, OBC, General, Woman, Minority, PwD (including Hindi equivalents: एससी, एसटी, ओबीसी, महिला).
  - **Geographic State / UT:** All 28 States and 8 Union Territories.
  - **Business Need / Sector:** Dairy, agriculture, retail shop, tailoring, transport, manufacturing, services.
  - **Separate Financial Attributes:** Annual family income (e.g., ₹2.5 Lakh) and requested project cost / loan amount (e.g., ₹5 Lakh) are strictly parsed and handled as distinct independent parameters.
- **Audit Persistence:** Extractions are logged to traceable database records via `services/nlp_persistence_service.py`.

### 🎯 AI Scheme Matching Engine
- **Deterministic Hard Filtering:** Strict pre-screening ensures zero hallucination on non-negotiable criteria (Social Category, Annual Income Ceilings, and State Boundaries).
- **Dense Vector Semantic Scoring:** Schemes are embedded using `SentenceTransformer` (`all-MiniLM-L6-v2`) and indexed in FAISS (`IndexFlatIP` on cosine-normalized vectors).
- **Recommendation Match Score:** Combines semantic query alignment with verified criteria bonuses.
  > *Transparency Note:* The score is strictly a **Recommendation Match Score** representing alignment with scheme objectives; it is **never** termed an approval probability or guarantee of sanction.
- **Explainability:** Each match includes an itemized breakdown (`why_matched`) clarifying why the user qualified.

### 💰 Financial Analysis & Simulation
- **EMI & Interest Calculation (`POST /api/finance/calculate-emi`):** Calculates exact monthly EMI, cumulative interest, total payment, and principal percentage.
- **Concessional Grant Handling:** Accurately processes 0% interest subsidies, capital subsidies, and moratorium periods.
- **What-If Simulation (`POST /api/finance/what-if`):** Enables entrepreneurs to model alterations in loan tenure, project cost, or interest rates before filing applications.
- **Financial Readiness:** Evaluates debt-to-income limits and checks project costs against statutory scheme loan ceilings.

### 📄 Smart Document Readiness
- **Scheme-Specific Document Rules:** Dynamically extracts required mandatory and optional documents for each scheme (Aadhaar, PAN, Caste Certificate, Income Proof, Project Report, Udyam Registration, Bank Passbook).
- **Upload Lifecycle:** Multi-format file intake (PDF, PNG, JPEG, WEBP) with size validation and secure server-side storage.
- **AI-Assisted OCR (`POST /api/documents/verify`):** Analyzes resolution, sharpness (Laplacian variance), and extracts textual fields using native OCR/Tesseract.
  > *Statutory Notice:* **OCR provides AI-assisted document extraction and format validation; it does not constitute government or administrative verification of authenticity.**
- **Readiness Scoring:** Computes completeness percentage (0–100%) and explains *why* each document is required for nodal processing.

### 📍 Intelligent Channel Partner Routing
- **Partner Classification:** Covers Public Sector Banks (SBI, PNB, Canara Bank, UCO), State SC/ST/OBC Development Corporations, District Industries Centres (DIC), and Regional Rural Banks (RRBs).
- **Ranking Algorithm:** Ranks channel partners using:
  1. Category Affinity (e.g., State SC Corporation for SC applicants)
  2. Scheme Specialization (e.g., PMEGP nodal branches)
  3. Proximity & Geo-location
- **Interactive Map:** Leaflet-powered visual map rendering partner locations and nodal contact details.
- **Geo-Corridor Calculation:** Uses Mappls API where configured.
  > *Implementation Note:* In the absence of live external map routing tokens, the system uses an **Approximate Distance Corridor** based on great-circle Haversine formulas.

### 📝 Application Lifecycle Tracking
- **Application Generation:** Creates unique, traceable application IDs (format: `APP-2026-XXXXX`).
- **Audit Timeline:** Preserves immutable lifecycle events (Drafted → Submitted → In Review → Approved / Disbursed).
- **Actor Attribution:** Every state transition captures the actor, timestamp (UTC ISO format), and status remarks.

### 🤖 Context-Aware AI Assistant
- **Dual-Mode Intelligence (`POST /api/chat`):**
  - **Groq Cloud API:** When configured (`GROQ_API_KEY`), queries Llama-3.3-70B with strict system prompt boundaries and PII masking.
  - **Local Context Engine:** When external AI APIs are offline, seamlessly falls back to the internal rule-based Scheme Saathi Context Engine.
- **Full Journey Context:** The floating assistant tracks current profile fields, selected scheme, EMI results, uploaded documents, and active application ID to answer queries accurately without hallucination.

### 👨‍💼 Nodal Admin & Operations Dashboard
- **Role-Based Access Control (RBAC):** Restricts administrative actions to authenticated nodal officers and admins via cryptographically signed JWT tokens.
- **Live Operations Dashboard:** Real-time metrics on total applications, pending verifications, scheme demand distribution, and nodal partner allocations.
- **Scheme Provenance Audit:** Inspects official source URLs (`.gov.in` / `myscheme.gov.in`) and clearly flags synthetic or demo records.

---

## 🔄 5. End-to-End User Journey

```mermaid
flowchart LR
    A[Citizen Need] --> B[Voice / Text]
    B --> C[Speech / NLP]
    C --> D[Profile Extraction]
    D --> E[Eligibility Engine]
    E --> F[Semantic Scheme Matching]
    F --> G[Explainable Recommendations]
    G --> H[Financial Analysis]
    H --> I[Document Readiness]
    I --> J[Partner Intelligence]
    J --> K[Map / Routing]
    K --> L[Application]
    L --> M[Status Tracking]
    M --> N[Authorized Review]
```

---

## 🏗️ 6. System Architecture

```
                                  +---------------------------------------+
                                  |     CITIZEN / APPLICANT / NODAL      |
                                  +---------------------------------------+
                                                      |
                                           HTTPS REST / JSON / Voice
                                                      v
+---------------------------------------------------------------------------------------------------------+
|                                    FRONTEND (React 19 + Vite)                                           |
|                                                                                                         |
|   +-------------------+   +--------------------+   +---------------------+   +---------------------+   |
|   |   Landing / Auth  |   |  Dashboard & Nav   |   | FinancialCalculator |   |   PartnerMap (GIS)  |   |
|   +-------------------+   +--------------------+   +---------------------+   +---------------------+   |
|   +-------------------+   +--------------------+   +---------------------+   +---------------------+   |
|   |  ProfileScreen    |   |  Results / Detail  |   |   DocumentsPanel    |   |   AiChatAssistant   |   |
|   +-------------------+   +--------------------+   +---------------------+   +---------------------+   |
+---------------------------------------------------------------------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------------+
|                                      BACKEND (FastAPI + Python 3.11)                                    |
|                                                                                                         |
|   [Routers Layer]                                                                                       |
|   /api/voice      /api/profile    /api/match       /api/finance    /api/partners                        |
|   /api/documents  /api/status     /api/chat        /api/admin      /api/auth                            |
|                                                                                                         |
|   [Core Services Layer]                                                                                 |
|   • voice_service (Bhashini/Whisper)         • finance_service (EMI & What-If)                          |
|   • nlp_service (Entity Extractor)           • partner_service (Routing & Proximity)                    |
|   • matcher_service (FAISS & Hard Rules)     • document_service (Checklist & OCR)                       |
|   • groq_service (Llama 3.3 / Local Fallback) • admin_service (RBAC & Audit Engine)                     |
|                                                                                                         |
|   [AI Engine]                                                                                           |
|   • SentenceTransformers (all-MiniLM-L6-v2)  • FAISS Vector Index (Normalized IP)                       |
|                                                                                                         |
|   [Persistence Layer]                                                                                   |
|   • Async SQLAlchemy 2.0 + PostgreSQL / asyncpg                                                         |
|   • In-Memory Fault-Tolerant Cache for Zero-Downtime Evaluation                                        |
+---------------------------------------------------------------------------------------------------------+
```

---

## 📂 7. Repository Layout

```
SIH/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Multi-job GitHub Actions CI Pipeline (Tests, Lint, Build)
├── backend/
│   ├── ai_engine/
│   │   ├── confidence.py              # Recommendation scoring formula & classification
│   │   ├── embedder.py                # SentenceTransformer singleton embedder
│   │   └── faiss_index.py             # FAISS index builder, persistence, and similarity search
│   ├── core/
│   │   ├── config.py                  # Pydantic BaseSettings loading .env
│   │   ├── database.py                # Async SQLAlchemy engine, session maker, init_db()
│   │   └── dependencies.py            # FastAPI auth and session dependencies
│   ├── data/
│   │   ├── schemes.json               # Canonical government scheme dataset
│   │   └── scheme_vectors.index       # Serialized FAISS vector index
│   ├── models/                        # SQLAlchemy 2.0 mapped models (Scheme, User, App, Docs)
│   ├── repositories/                  # Data access layer repositories
│   ├── routers/                       # FastAPI REST API endpoints
│   ├── schemas/                       # Pydantic v2 request/response contracts
│   ├── services/                      # Business logic, OCR, NLP, Routing, Finance, Admin
│   ├── tests/                         # Pytest test suite (276 unit and integration tests)
│   ├── .env.example                   # Backend environment configuration template
│   ├── main.py                        # FastAPI entry point with lifespan events
│   └── requirements.txt               # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx     # Nodal Admin operations & metrics interface
│   │   │   ├── AiChatAssistant.jsx    # Floating Scheme Saathi AI Assistant
│   │   │   ├── FinancialCalculator.jsx# Interactive loan, interest, and What-If simulator
│   │   │   ├── GoogleAuthButton.jsx   # Google GIS OAuth authentication component
│   │   │   └── PartnerMap.jsx         # Leaflet/Mappls partner GIS directory
│   │   ├── services/api/              # Modular API client wrappers
│   │   ├── App.jsx                    # Primary application shell & navigation router
│   │   └── index.css                  # Global styles & Tailwind CSS directives
│   ├── .env                           # Frontend build-time configuration
│   ├── package.json                   # React 19, Vite, Leaflet, Tailwind dependencies
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   └── vite.config.js                 # Vite build configuration
├── docs/
│   └── deployment.md                  # Comprehensive deployment runbook
├── render.yaml                        # Render Blueprint specification
└── README.md                          # Root system documentation
```

---

## 🚀 8. Quickstart Guide (Local Development)

### Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** 20+ with `npm`
- **Git:** Installed and available on system PATH

### Step 1: Clone the Repository
```bash
git clone https://github.com/DevAggarwal23/Coding_pirate.git
cd Coding_pirate
```

### Step 2: Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp backend/.env.example backend/.env

# Start FastAPI backend server
uvicorn main:app --app-dir backend --reload --port 8000
```
- Interactive API Docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Alternative API Docs (ReDoc): `http://127.0.0.1:8000/redoc`

### Step 3: Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
- Frontend Web App: `http://localhost:5173`

---

## ⚙️ 9. Configuration & Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | Yes | `development` | Deployment environment (`development` / `production`). |
| `PORT` | No | `8000` | Port for the Uvicorn ASGI server. |
| `SECRET_KEY` | Yes | — | Secret key for signing session tokens and JWTs. |
| `DATABASE_URL` | No | `postgresql+asyncpg://...` | Async PostgreSQL connection string. Defaults to memory/file if omitted. |
| `CORS_ORIGINS` | Yes | `http://localhost:5173,...` | Allowed CORS origins for the frontend. |
| `BHASHINI_ENABLED` | No | `false` | Enable/disable Bhashini government voice pipeline. |
| `BHASHINI_API_URL` | No | *Official endpoint* | Bhashini ULCA inference pipeline URL. |
| `BHASHINI_INFERENCE_API_KEY` | No | — | Bhashini inference credential (kept strictly on server). |
| `GROQ_API_KEY` | No | — | Groq Cloud API key for Llama-3.3-70B model inference. |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Primary model identifier. |
| `MAPPLS_API_KEY` | No | — | Mappls server-side routing key (falls back to Haversine). |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth 2.0 client ID for token verification. |
| `FAISS_INDEX_PATH` | Yes | `data/scheme_vectors.index`| Path to serialized FAISS vector index. |
| `SCHEMES_JSON_PATH` | Yes | `data/schemes.json` | Path to canonical scheme database JSON. |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API (`http://127.0.0.1:8000` or production URL). |
| `VITE_MAPPLS_MAP_KEY` | No | Mappls interactive map SDK key. |
| `VITE_GOOGLE_CLIENT_ID` | No | Google Identity Services (GIS) Web Client ID. |

---

## 🧪 10. Verification & Quality Gates

The repository enforces strict continuous integration standards:

### 1. Automated Backend Tests (Pytest)
```bash
pytest backend/tests/ -q --tb=no
```
```
........................................................................ [ 26%]
........................................................................ [ 52%]
........................................................................ [ 78%]
............................................................             [100%]
276 passed, 103 warnings in 4.81s
```
**Status: 276 / 276 Tests Passing.**

### 2. Frontend Production Compilation
```bash
cd frontend && npm run build
```
```
vite v8.3.0 building client environment for production...
✓ 1870 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-BrG9ZYPP.css   42.27 kB │ gzip:  12.42 kB
dist/assets/index-BEBmG6X1.js   847.56 kB │ gzip: 228.20 kB
✓ built in 1.42s — ZERO ERRORS
```

### 3. GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)
- **Secret Scan Job:** Inspects Git commits for leaked credentials, passwords, and private keys.
- **Backend Test Job:** Installs dependencies and runs all 276 tests on Python 3.11.
- **Frontend Build Job:** Audits React bundle compilation and type integrity on Node.js 20.

---

## 🔒 11. Security & Compliance Declarations

1. **Zero Hardcoded Secrets:** All credentials, private tokens, and connection strings are strictly managed via environment variables and excluded by `.gitignore`.
2. **PII Masking:** User Aadhaar, PAN, and phone numbers are masked using regex patterns before being processed or transmitted to external AI providers.
3. **Deterministic Hard Eligibility:** AI semantic scoring is never permitted to override statutory criteria (income thresholds, category status, or state residence).
4. **Disclaimers on AI Decisions:**
   - The match score is explicitly termed a **Recommendation Match Score**.
   - OCR validation confirms document readability and structure; it is not administrative verification.
   - Channel Partner routing calculations without external map tokens are explicitly designated as an **Approximate Distance Corridor**.

---

## 👥 12. Team & Acknowledgments

- **Hackathon:** Smart India Hackathon (SIH 2026)
- **Problem Statement ID:** SIH26092
- **Nodal Ministry:** Ministry of Social Justice and Empowerment (MoSJE)
- **Team Name:** Coding Pirates
- **Repository:** [DevAggarwal23/Coding_pirate](https://github.com/DevAggarwal23/Coding_pirate)

---

## 📄 13. License

This project is developed for evaluation under the **Smart India Hackathon (SIH 2026)**.  
Licensed under the Apache 2.0 License.
