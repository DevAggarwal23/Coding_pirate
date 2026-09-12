# Scheme Saathi (SIH26092) — Production Deployment & CI/CD Guide

> **IMPORTANT ARCHITECTURAL NOTICE:**
> **Supabase is explicitly omitted in this deployment phase.**
> The current database architecture (PostgreSQL via asyncpg / local persistence fallback) remains active. Supabase database and storage migration will be conducted as a dedicated separate step.

---

## 1. System Architecture Overview

`
                        [ User Browser ]
                               |
                               v
            [ Vercel Frontend (Vite + React SPA) ]
                               |
                      HTTPS API Calls
                               |
                               v
         [ Render Backend (FastAPI + Uvicorn ASGI) ]
          /           |            |             \
         v            v            v              v
   [ FAISS AI ]   [ Groq AI ]  [ Bhashini ]  [ Postgre/DB ]
   (Vectors)      (Chatbot)    (Voice/ASR)   (Metadata/Auth)
`

---

## 2. GitHub Repository Structure & CI/CD

The project is structured as a **single unified monorepo**:

`
E:\SIH\
+-- .github/
¦   +-- workflows/
¦       +-- ci.yml             # Automated Secret Scan, Pytest Suite, & Vite Build
+-- backend/                   # FastAPI application & AI Engine
¦   +-- ai_engine/             # FAISS index & SentenceTransformer embedder
¦   +-- core/                  # Configuration & DB connection
¦   +-- models/                # SQLAlchemy schemas
¦   +-- routers/               # API endpoint definitions
¦   +-- schemas/               # Pydantic v2 validation models
¦   +-- services/              # Business logic (NLP, Voice, Matcher, Auth, etc.)
¦   +-- tests/                 # Complete Pytest test suite (276 unit tests)
¦   +-- requirements.txt       # Python backend dependencies
¦   +-- .env.example           # Backend environment template
+-- frontend/                  # React 19 + Vite frontend
¦   +-- src/                   # Components, API clients, and UI state
¦   +-- public/                # Static assets (Farmer hero image, icons)
¦   +-- package.json           # Frontend dependencies
¦   +-- package-lock.json      # Locked npm dependencies
¦   +-- vercel.json            # Vercel SPA routing rewrite rule
¦   +-- .env.example           # Frontend environment template
+-- docs/                      # Documentation
¦   +-- deployment.md          # This deployment specification
+-- render.yaml                # Render Web Service blueprint
+-- .gitignore                 # Exclusion rules for secrets, virtual environments, caches
`

### GitHub Actions Quality Gates
Every push and pull request to main or develop triggers .github/workflows/ci.yml:
1. **Secret Scan**: Analyzes codebase to prevent leaking API keys, private keys, or credentials.
2. **Backend Tests**: Executes pytest backend/tests/ -q against the test matrix.
3. **Frontend Build**: Verifies 
pm ci && npm run build for zero bundle errors.

---

## 3. Backend Deployment on Render

### Step-by-Step Setup:
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: scheme-saathi-backend
   - **Region**: Singapore or Frankfurt (or nearest region)
   - **Branch**: main
   - **Root Directory**: . *(leave blank or set to root)*
   - **Runtime**: Python 3
   - **Build Command**: pip install -r backend/requirements.txt
   - **Start Command**: uvicorn main:app --app-dir backend --host 0.0.0.0 --port 
5. Under **Advanced** $\rightarrow$ **Environment Variables**, add:

| Variable | Recommended / Example Value | Description |
| :--- | :--- | :--- |
| ENVIRONMENT | production | Enables production optimizations |
| DATABASE_URL | postgresql+asyncpg://<user>:<password>@<host>:5432/<dbname> | PostgreSQL database connection string |
| SECRET_KEY | *(Generate 32-byte hex key)* | JWT signing and cryptographic sessions |
| CORS_ORIGINS | https://<your-vercel-domain>.vercel.app | Comma-separated allowed frontend domains |
| FAISS_INDEX_PATH | data/scheme_vectors.index | Path to FAISS scheme vectors |
| SCHEMES_JSON_PATH | data/schemes.json | Path to scheme metadata catalog |
| GOOGLE_CLIENT_ID | <your-google-client-id>.apps.googleusercontent.com | Google OAuth Web Client ID |
| GOOGLE_CLIENT_SECRET | GOCSPX-<your-secret> | Google OAuth Server-side verification secret |
| GROQ_API_KEY | gsk_<your-key> | Groq AI LLM inference key (backend only) |
| BHASHINI_ENABLED | alse *(or 	rue if credentials provided)* | Enable Bhashini Multilingual ASR |
| MAPPLS_API_KEY | *(optional)* | Mappls server-side routing key |

6. Click **Create Web Service**.
7. Test Health Endpoint: https://<your-render-service>.onrender.com/api/health

---

## 4. Frontend Deployment on Vercel

### Step-by-Step Setup:
1. Log into [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click Edit and select rontend
   - **Build Command**: 
pm run build
   - **Output Directory**: dist
   - **Install Command**: 
pm ci
5. Under **Environment Variables**, add:

| Variable | Value | Description |
| :--- | :--- | :--- |
| VITE_API_BASE_URL | https://<your-render-service>.onrender.com | Backend API URL (no trailing slash) |
| VITE_GOOGLE_CLIENT_ID | <your-google-client-id>.apps.googleusercontent.com | Public Google OAuth Client ID |
| VITE_MAPPLS_MAP_KEY | *(optional public key)* | Mappls Vector Maps browser key |

6. Click **Deploy**.

---

## 5. Third-Party Service Configuration

### A. Google OAuth 2.0 (Google Cloud Console)
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/) $\rightarrow$ **APIs & Services** $\rightarrow$ **Credentials**.
2. Select your OAuth 2.0 Web Client ID.
3. Under **Authorized JavaScript origins**, add:
   - http://localhost:5173 *(for local development)*
   - https://<your-vercel-domain>.vercel.app *(for production)*
4. Under **Authorized redirect URIs**, add:
   - http://localhost:5173
   - https://<your-vercel-domain>.vercel.app
5. Save changes (note: propagation may take 5 minutes).

### B. Groq AI Integration
- GROQ_API_KEY is strictly isolated on the FastAPI backend.
- The frontend calls /api/chat without possessing the secret key.

### C. Document Storage Consideration
- Uploaded files are written to uploads/documents on the backend filesystem.
- On ephemeral instances without persistent disks, physical files are temporary while metadata persists in the database.

---

## 6. Post-Deployment Smoke Test Checklist

- [ ] GET https://<your-render-service>.onrender.com/api/health returns {"status":"ok"}.
- [ ] Direct page refreshes work smoothly without 404s (SPA rewrite verified).
- [ ] Google Sign-In authenticates successfully via POST /api/auth/google.
- [ ] Spoken voice / microphone captures audio and transcribes accurately.
- [ ] NLP entity extraction populates user category, income, and state.
- [ ] Matching engine returns top government schemes with explainability metrics.
- [ ] AI Chat Assistant responds to welfare and financial queries.
- [ ] Browser DevTools Network tab shows 0 requests to localhost or 127.0.0.1.
