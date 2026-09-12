# 🚀 SIH26092 — AI-Driven Scheme Matching for Marginalized Entrepreneurs
## Team: Coding Pirates

### Quick Start
```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

### Architecture
Voice Input ──┐
              ├──► NLP Pipeline ──► AI Matcher ──► Scheme Results
Text Input  ──┘

### Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI (Python)
- AI: Sentence-transformers + FAISS
- Voice: Whisper (demo) → Bhashini (production)
- DB: PostgreSQL + pgvector
- Deploy: Vercel + Render
