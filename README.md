# Scheme Saathi (SIH26092)
## AI-Driven Government Scheme Matching for Marginalized Entrepreneurs

> **Ministry**: Ministry of Social Justice and Empowerment (MoSJE)  
> **Theme**: Smart Automation & Social Inclusion  
> **Team**: Coding Pirates

---

## ?? Overview

**Scheme Saathi** is an AI-powered welfare discovery and financial inclusion platform engineered for Indian citizens, artisans, women, and marginalized entrepreneurs. The system enables users to speak or type in their local language, automatically extracts eligibility profiles, semantically matches central and state government welfare schemes via FAISS vector search, and routes applications through verified Lead District Nodal Officers.

---

## ??? Architecture

`
[ User (Voice/Text) ]
        |
        v
[ React 19 + Vite Frontend ] (Vercel)
        |
        | HTTPS REST Calls
        v
[ FastAPI + Uvicorn ASGI Backend ] (Render)
  +-- NLP Entity Extraction (Regex & Semantic Profiler)
  +-- Multilingual Voice Processing (Bhashini & Whisper)
  +-- Semantic AI Matching Engine (FAISS + Rule Validation)
  +-- Contextual AI Assistant (Groq Llama-3.3-70b)
  +-- Channel Partner Proximity Routing (Mappls Corridor)
  +-- Document Verification & Readiness (OCR Engine)
  +-- Application Lifecycle Management (PostgreSQL DB)
`

---

## ?? Quick Start (Local Development)

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+ (with 
pm)
- **Git**

### 2. Backend Setup
`ash
# Clone the repository
git clone https://github.com/<your-org>/scheme-saathi.git
cd scheme-saathi

# Create & activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Create local environment configuration
cp backend/.env.example backend/.env

# Start FastAPI server
uvicorn main:app --app-dir backend --reload --port 8000
`
API Documentation will be live at http://localhost:8000/docs.

### 3. Frontend Setup
`ash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies using lockfile
npm ci

# Create local environment configuration
cp .env.example .env

# Start Vite development server
npm run dev
`
Frontend interface will be live at http://localhost:5173.

---

## ?? Testing & CI/CD Quality Gates

The project contains a complete automated test suite and GitHub Actions workflow:

`ash
# Run backend test suite (276 tests)
pytest backend/tests/ -q

# Build frontend production bundle
cd frontend && npm run build
`

### GitHub Actions CI Workflow (.github/workflows/ci.yml)
- **Secret Scan**: Scans repository for uncommitted credentials or private keys.
- **Backend Tests**: Executes the complete Pytest suite in isolated Python 3.11.
- **Frontend Build**: Validates compilation and bundle integrity on Node 20.

---

## ?? Production Deployment

| Tier | Platform | Build Command | Start Command / Output |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | 
pm run build | Root: rontend, Output: dist |
| **Backend** | **Render** | pip install -r backend/requirements.txt | uvicorn main:app --app-dir backend --host 0.0.0.0 --port  |

Detailed step-by-step instructions are available in [docs/deployment.md](docs/deployment.md).

> **Note on Database**: Supabase is omitted in this deployment stage. Existing PostgreSQL / local persistence architecture remains active.

---

## ?? Security Best Practices
- Zero hardcoded API keys or private credentials in the source code.
- Cryptographically verified Google OAuth tokens (Google GIS).
- Strict backend isolation for AI inference keys (GROQ_API_KEY, BHASHINI_API_KEY).
- Dynamic CORS origin validation (CORS_ORIGINS).
- RBAC authorization enforcing default pplicant security role.

---

## ?? License
Developed for the Smart India Hackathon (SIH 2026) under Problem Statement **SIH26092**.
