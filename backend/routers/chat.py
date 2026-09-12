"""
SIH26092 — SchemeSaathi RAG AI Chatbot Router.
Multi-Provider Hybrid Architecture:
1. Groq Cloud AI (Llama 3.3 70B / 3.1 8B) if GROQ_API_KEY is configured.
2. Grok AI (xAI API) if GROK_API_KEY / XAI_API_KEY is configured.
3. Google Gemini AI if GEMINI_API_KEY is configured.
4. Local FAISS RAG Synthesizer (100% offline, zero-cost fallback).
"""
import os
import time
import uuid
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from core.config import settings
from core.dependencies import get_db
from ai_engine.embedder import encode
from ai_engine.faiss_index import scheme_index
from services.scheme_service import get_all_schemes_cached

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])


class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="User question or query text")
    language: str = Field(default="hi", description="Language code: hi/en/ta/te/bn/mr")
    category: Optional[str] = Field(default=None, description="User category: SC / ST / OBC / Women / PwD / General")
    income: Optional[float] = Field(default=None, description="Annual income in INR")
    business_type: Optional[str] = Field(default=None, description="Business type / Sector")
    session_id: Optional[str] = Field(default=None, description="Conversation session ID")


class MatchedSchemeSummary(BaseModel):
    scheme_id: str
    scheme_name: str
    ministry: str
    benefit_summary: str
    score: float
    categories: List[str]
    application_url: Optional[str] = None


class ChatMessageResponse(BaseModel):
    reply: str
    matched_schemes: List[MatchedSchemeSummary]
    language: str
    session_id: str
    confidence_score: float
    processing_time_ms: int
    provider: str = Field(default="local_faiss_rag", description="AI Provider used: groq_ai / grok_ai / gemini_ai / local_faiss_rag")


async def _query_groq_api(
    api_key: str,
    user_msg: str,
    top_schemes: List[Dict[str, Any]],
    lang: str,
) -> Optional[str]:
    """Call Groq Cloud API (Llama-3.3-70b / Llama-3.1-8b)."""
    context_lines = []
    for i, s in enumerate(top_schemes[:4], 1):
        context_lines.append(
            f"{i}. {s.get('scheme_name')} ({s.get('ministry')}): Benefit='{s.get('benefit_summary')}', "
            f"Eligible='{s.get('categories')}', Docs='{s.get('documents_req')}'"
        )
    context_str = "\n".join(context_lines)

    sys_prompt = (
        "You are SchemeSaathi AI Assistant for marginalized entrepreneurs (SC/ST/OBC/Women/PwD) created for SIH26092. "
        "Answer the user's question clearly, politely, and accurately using the provided scheme context. "
        f"Format your response in language code '{lang}'. Keep answers structured with bullet points where appropriate."
    )

    prompt = f"User Question: {user_msg}\n\nTop Matched RAG Schemes Context:\n{context_str}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "SchemeSaathi/1.0",
    }

    models_to_try = ["groq/compound", "groq/compound-mini", "qwen/qwen3.6-27b", "openai/gpt-oss-120b"]

    for model_name in models_to_try:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    reply = data["choices"][0]["message"]["content"]
                    logger.info(f"✅ Groq Cloud API ({model_name}) responded successfully")
                    return reply
                else:
                    logger.warning(f"Groq API ({model_name}) returned HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Groq API ({model_name}) request failed: {e}")
    return None


async def _query_grok_api(
    api_key: str,
    user_msg: str,
    top_schemes: List[Dict[str, Any]],
    lang: str,
) -> Optional[str]:
    """Call Grok (xAI API) using OpenAI-compatible chat completions endpoint."""
    context_lines = [f"{s.get('scheme_name')}: {s.get('benefit_summary')}" for s in top_schemes[:4]]
    context_str = "\n".join(context_lines)

    sys_prompt = f"You are SchemeSaathi AI Assistant for SIH26092. Answer in language '{lang}' using scheme data."
    prompt = f"User Question: {user_msg}\nContext:\n{context_str}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "grok-2-latest",
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://api.x.ai/v1/chat/completions", json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"Grok API request failed: {e}")
    return None


async def _query_gemini_api(
    api_key: str,
    user_msg: str,
    top_schemes: List[Dict[str, Any]],
    lang: str,
) -> Optional[str]:
    """Call Google Gemini API generateContent endpoint."""
    context_lines = [f"- {s.get('scheme_name')}: {s.get('benefit_summary')}" for s in top_schemes[:4]]
    context_str = "\n".join(context_lines)

    prompt = f"You are SchemeSaathi AI. Answer in '{lang}'.\nUser Query: {user_msg}\nSchemes Data:\n{context_str}"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        logger.warning(f"Gemini API request failed: {e}")
    return None


def _generate_multilingual_response(
    query: str,
    top_schemes: List[Dict[str, Any]],
    lang: str,
    user_cat: Optional[str] = None,
) -> str:
    """Local offline RAG Synthesizer."""
    if not top_schemes:
        if lang == "hi":
            return "क्षमा करें, मुझे आपकी खोज से मेल खाती कोई योजना नहीं मिली। कृपया अपनी श्रेणी (SC/ST/OBC/महिला/दिव्यांग) या व्यवसाय का प्रकार स्पष्ट करें।"
        return "I couldn't find a matching scheme for your specific prompt. Please mention your category (SC/ST/OBC/Women/PwD) or business type so I can help you better!"

    primary_scheme = top_schemes[0]
    s_name = primary_scheme.get("scheme_name", "Government Scheme")
    s_benefit = primary_scheme.get("benefit_summary") or primary_scheme.get("benefit_amount", "Financial Support")
    s_ministry = primary_scheme.get("ministry", "Government of India")
    s_docs = ", ".join(primary_scheme.get("documents_req", ["Aadhaar", "Bank Account", "Category Certificate"])[:3])

    if lang == "hi":
        msg = f"नमस्ते! आपकी खोज के अनुसार, सबसे उपयुक्त योजना **{s_name}** ({s_ministry}) है।\n\n"
        msg += f"💡 **मुख्य लाभ:** {s_benefit}\n"
        msg += f"📋 **आवश्यक दस्तावेज़:** {s_docs}\n\n"
        if len(top_schemes) > 1:
            other_names = ", ".join([s.get("scheme_name", "") for s in top_schemes[1:3]])
            msg += f"🔍 अन्य प्रासंगिक योजनाएं: **{other_names}**\n\n"
        msg += "आप SchemeSaathi पर सीधे दस्तावेज़ अपलोड करके पात्रता सत्यापित कर सकते हैं और आवेदन कर सकते हैं!"
        return msg
    elif lang == "bn":
        msg = f"নমস্কার! আপনার প্রশ্নের ভিত্তিতে সবচেয়ে উপযুক্ত প্রকল্প হলো **{s_name}** ({s_ministry})।\n\n"
        msg += f"💡 **প্রধান সুবিধা:** {s_benefit}\n"
        msg += f"📋 **প্রয়োজনীয় নথি:** {s_docs}\n\n"
        msg += "আপনি SchemeSaathi মাধ্যমে সরাসরি নথিপত্র আপলোড করে আবেদন করতে পারেন!"
        return msg
    elif lang == "ta":
        msg = f"வணக்கம்! உங்கள் கேள்விக்கு ஏற்ற சிறந்த திட்டம் **{s_name}** ({s_ministry}) ஆகும்.\n\n"
        msg += f"💡 **முக்கிய பலன்:** {s_benefit}\n"
        msg += f"📋 **தேவையான ஆவணங்கள்:** {s_docs}\n\n"
        msg += "SchemeSaathi மூலம் நீங்கள் ஆன்லைனில் விண்ணப்பிக்கலாம்!"
        return msg
    elif lang == "mr":
        msg = f"नमस्कार! तुमच्या शोधानुसार सर्वात योग्य योजना **{s_name}** ({s_ministry}) आहे.\n\n"
        msg += f"💡 **मुख्य लाभ:** {s_benefit}\n"
        msg += f"📋 **आवश्यक कागदपत्रे:** {s_docs}\n\n"
        msg += "तुम्ही SchemeSaathi वर कागदपत्रे अपलोड करून थेट अर्ज करू शकता!"
        return msg
    else:
        msg = f"Hello! Based on your inquiry, the top recommended scheme for you is **{s_name}** under **{s_ministry}**.\n\n"
        msg += f"💡 **Key Benefit:** {s_benefit}\n"
        msg += f"📋 **Required Documents:** {s_docs}\n\n"
        if len(top_schemes) > 1:
            other_names = ", ".join([s.get("scheme_name", "") for s in top_schemes[1:3]])
            msg += f"🔍 Other matching schemes: **{other_names}**\n\n"
        msg += "You can use SchemeSaathi to instantly verify your documents via OCR and proceed with the application!"
        return msg


@router.post("", response_model=ChatMessageResponse)
@router.post("/query", response_model=ChatMessageResponse)
async def chat_with_schemesaathi(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Multi-Provider RAG AI Chatbot Endpoint.
    1. Groq Cloud AI (Llama 3.3 70B / Llama 3.1 8B)
    2. Grok AI (xAI API)
    3. Google Gemini AI
    4. Local FAISS Vector RAG Synthesizer (100% offline fallback)
    """
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    user_msg = request.message.strip()

    if not user_msg:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    try:
        # 1. FAISS RAG Retrieval over 405 schemes
        all_schemes = await get_all_schemes_cached(db)
        scheme_dict_map = {s["scheme_id"]: s for s in all_schemes if "scheme_id" in s}

        query_vector = encode(user_msg)
        faiss_results = scheme_index.search(query_vector, k=5)

        matched_summaries: List[MatchedSchemeSummary] = []
        top_schemes_full: List[Dict[str, Any]] = []

        if faiss_results:
            for s_id, sim_score in faiss_results:
                s_obj = scheme_dict_map.get(s_id)
                if s_obj:
                    scaled_score = round(min(0.98, max(0.55, float(sim_score))), 2)
                    matched_summaries.append(
                        MatchedSchemeSummary(
                            scheme_id=s_obj.get("scheme_id", s_id),
                            scheme_name=s_obj.get("scheme_name", "Scheme"),
                            ministry=s_obj.get("ministry", "Government of India"),
                            benefit_summary=s_obj.get("benefit_summary") or s_obj.get("benefit_amount", ""),
                            score=scaled_score,
                            categories=s_obj.get("categories", []),
                            application_url=s_obj.get("application_url"),
                        )
                    )
                    top_schemes_full.append(s_obj)

        if not top_schemes_full and all_schemes:
            top_schemes_full = all_schemes[:3]

        # 2. Provider Priority Selection
        groq_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        grok_key = settings.grok_api_key or settings.xai_api_key or os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
        gemini_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")

        provider_used = "local_faiss_rag"
        reply_text = None

        # Priority 1: Groq Cloud AI (Llama 3.3 70B)
        if groq_key:
            reply_text = await _query_groq_api(groq_key, user_msg, top_schemes_full, request.language)
            if reply_text:
                provider_used = "groq_ai"

        # Priority 2: Grok AI
        if not reply_text and grok_key:
            reply_text = await _query_grok_api(grok_key, user_msg, top_schemes_full, request.language)
            if reply_text:
                provider_used = "grok_ai"

        # Priority 3: Gemini AI
        if not reply_text and gemini_key:
            reply_text = await _query_gemini_api(gemini_key, user_msg, top_schemes_full, request.language)
            if reply_text:
                provider_used = "gemini_ai"

        # Priority 4: Local Offline RAG Synthesizer
        if not reply_text:
            reply_text = _generate_multilingual_response(
                query=user_msg,
                top_schemes=top_schemes_full,
                lang=request.language,
                user_cat=request.category,
            )
            provider_used = "local_faiss_rag"

        elapsed_ms = int((time.time() - start_time) * 1000)
        conf = matched_summaries[0].score if matched_summaries else 0.85

        return ChatMessageResponse(
            reply=reply_text,
            matched_schemes=matched_summaries,
            language=request.language,
            session_id=session_id,
            confidence_score=conf,
            processing_time_ms=elapsed_ms,
            provider=provider_used,
        )

    except Exception as e:
        logger.error(f"Chat processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat assistant error: {str(e)}")
