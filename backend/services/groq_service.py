"""
SIH26092 — Groq AI Chatbot Service & Context Engine.
Provides context-aware conversational AI for the Scheme_Saathi beneficiary journey.
Utilizes Groq Cloud API (Llama 3.3 70B / 3.1 8B) with fallback to local context synthesizer.
"""
import os
import re
import time
import uuid
import logging
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatContext,
    SuggestedAction,
    MatchedSchemeBrief,
    ChatHistoryItem,
)
from ai_engine.embedder import encode
from ai_engine.faiss_index import scheme_index
from services.scheme_service import get_all_schemes_cached

logger = logging.getLogger(__name__)

# Constants
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
FALLBACK_GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_TIMEOUT_SECONDS = 12.0
MAX_HISTORY_MESSAGES = 8
MAX_USER_MESSAGE_LENGTH = 1000


def mask_sensitive_data(text: str) -> str:
    """
    Sanitizes text by masking sensitive PII (Aadhaar, PAN, phone numbers).
    """
    if not text:
        return text
    # Mask Aadhaar numbers: 1234-5678-9012 or 1234 5678 9012 or 12 digits
    text = re.sub(r"\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b", r"XXXX-XXXX-\3", text)
    text = re.sub(r"\b(\d{8})(\d{4})\b", r"XXXXXXXX\2", text)
    # Mask PAN numbers: ABCDE1234F
    text = re.sub(r"\b([A-Z]{5})(\d{4})([A-Z])\b", r"XXXXX\2\3", text)
    # Mask 10-digit Indian mobile numbers
    text = re.sub(r"\b(?:\+91[\s-]?)?([6-9]\d{5})(\d{4})\b", r"+91 XXXXX \2", text)
    return text


def build_system_prompt(context: Optional[ChatContext], language: str) -> str:
    """
    Constructs the authoritative system instruction with strict hallucination and role boundaries.
    """
    lang_name = {
        "hi": "Hindi (हिन्दी)",
        "en": "English",
        "bn": "Bengali (বাংলা)",
        "ta": "Tamil (தமிழ்)",
        "mr": "Marathi (मराठी)",
        "te": "Telugu (తెలుగు)",
    }.get(language, "English")

    return (
        "You are Scheme Saathi, an empathetic and intelligent AI assistant helping marginalized entrepreneurs "
        "(SC/ST/OBC/Women/PwD) in India understand government welfare schemes and navigate their application journey.\n\n"
        "### STRICT OPERATING RULES & GUARDRAILS:\n"
        "1. DISTINGUISH STAGES: Clearly distinguish between Recommendation, Likely Eligibility, Financial Estimates, "
        "Application Readiness, and Official Sanction/Approval. NEVER claim or promise that a loan/scheme is approved or guaranteed.\n"
        "2. NO INVENTED FACTS: Use only the provided verified context for scheme rules, interest rates, loan limits, document lists, and partner routing. "
        "If specific information is not in the context, clearly state: 'I don't have verified information about that right now.'\n"
        "3. PROMPT CONTEXT AWARENESS: You have access to the user's active profile, selected scheme, financial plan, uploaded documents, channel partner, and application tracking status.\n"
        "4. PRIVACY: Never ask for or output raw Aadhaar, PAN, passwords, or bank account PINs.\n"
        f"5. LANGUAGE: Respond naturally and clearly in {lang_name}. If the user speaks in colloquial Hinglish (e.g. 'bhai mujhe loan chahiye'), respond politely in natural conversational Hinglish/Hindi.\n"
        "6. TONE: Concise, helpful, action-oriented, and encouraging for first-time entrepreneurs."
    )


def build_context_block(context: Optional[ChatContext]) -> str:
    """
    Formats available beneficiary journey context into a compact markdown summary for the LLM.
    """
    if not context:
        return "No specific journey context currently active."

    lines = []

    # Profile
    if context.profile:
        p = context.profile
        parts = []
        if p.category:
            parts.append(f"Category: {p.category}")
        if p.income is not None:
            parts.append(f"Annual Income: ₹{int(p.income):,}")
        if p.state:
            parts.append(f"State: {p.state}")
        if p.business_type:
            parts.append(f"Sector: {p.business_type}")
        if p.project_cost is not None:
            parts.append(f"Project Cost: ₹{int(p.project_cost):,}")
        if parts:
            lines.append(f"**Beneficiary Profile:** {', '.join(parts)}")

    # Selected Scheme
    if context.selected_scheme:
        s = context.selected_scheme
        s_parts = [f"**Selected Scheme:** {s.scheme_name or s.scheme_id}"]
        if s.ministry:
            s_parts.append(f"Ministry: {s.ministry}")
        if s.benefit:
            s_parts.append(f"Benefit: {s.benefit}")
        if s.loan_limit:
            s_parts.append(f"Loan Ceiling: {s.loan_limit}")
        if s.interest:
            s_parts.append(f"Interest Rate: {s.interest}")
        if s.tenure:
            s_parts.append(f"Tenure: {s.tenure}")
        lines.append(" | ".join(s_parts))

    # Finance / EMI
    if context.finance:
        f = context.finance
        f_parts = []
        if f.requested_loan:
            f_parts.append(f"Loan Amount: ₹{int(f.requested_loan):,}")
        if f.monthly_emi:
            f_parts.append(f"Est. Monthly EMI: ₹{int(f.monthly_emi):,}")
        if f.interest_rate:
            f_parts.append(f"Rate: {f.interest_rate}%")
        if f.tenure_years:
            f_parts.append(f"Tenure: {f.tenure_years} Years")
        if f.financial_readiness_score is not None:
            f_parts.append(f"Financial Readiness: {f.financial_readiness_score}/100")
        if f_parts:
            lines.append(f"**Financial Plan (Indicative):** {', '.join(f_parts)}")

    # Document Readiness
    if context.documents:
        d = context.documents
        d_parts = []
        if d.completion_percentage is not None:
            d_parts.append(f"Readiness: {d.completion_percentage}%")
        if d.uploaded_documents:
            d_parts.append(f"Uploaded: {', '.join(d.uploaded_documents)}")
        if d.missing_documents:
            d_parts.append(f"Missing Mandatory: {', '.join(d.missing_documents)}")
        if d.is_ready_to_submit is not None:
            d_parts.append("Ready to Submit" if d.is_ready_to_submit else "Documents Incomplete")
        if d_parts:
            lines.append(f"**Document Verification Status:** {'; '.join(d_parts)}")

    # Channel Partner
    if context.partner:
        pt = context.partner
        pt_parts = []
        if pt.partner_name:
            pt_parts.append(f"Partner: {pt.partner_name}")
        if pt.partner_type:
            pt_parts.append(f"Type: {pt.partner_type}")
        if pt.distance_km is not None:
            pt_parts.append(f"Distance: ~{pt.distance_km} km")
        if pt_parts:
            lines.append(f"**Assigned / Recommended Partner:** {', '.join(pt_parts)}")

    # Application
    if context.application:
        app = context.application
        app_parts = []
        if app.application_id:
            app_parts.append(f"ID: {app.application_id}")
        if app.status_label or app.status:
            app_parts.append(f"Status: {app.status_label or app.status}")
        if app.submitted_at:
            app_parts.append(f"Submitted: {app.submitted_at}")
        if app.partner_name:
            app_parts.append(f"Nodal Partner: {app.partner_name}")
        if app.next_step:
            app_parts.append(f"Next Action: {app.next_step}")
        if app_parts:
            lines.append(f"**Application Record:** {', '.join(app_parts)}")

    return "\n".join(lines) if lines else "No specific journey context currently active."


def generate_suggested_actions(context: Optional[ChatContext], user_msg: str) -> List[SuggestedAction]:
    """
    Dynamically generates relevant, clickable action chips based on the beneficiary's journey stage.
    """
    actions: List[SuggestedAction] = []
    msg_lower = (user_msg or "").lower()

    has_scheme = context and context.selected_scheme and (context.selected_scheme.scheme_id or context.selected_scheme.scheme_name)
    has_finance = context and context.finance and (context.finance.monthly_emi or context.finance.requested_loan)
    has_docs = context and context.documents
    docs_ready = has_docs and context.documents.is_ready_to_submit
    has_partner = context and context.partner and context.partner.partner_name
    has_app = context and context.application and context.application.application_id

    # 1. Scheme Actions
    if not has_scheme or "scheme" in msg_lower or "match" in msg_lower or "योजना" in msg_lower:
        actions.append(
            SuggestedAction(
                action_type="find_schemes",
                label="🔍 Find Schemes",
                description="Discover eligible schemes matched to your profile",
            )
        )
    elif has_scheme:
        actions.append(
            SuggestedAction(
                action_type="view_scheme",
                label="📄 Scheme Details",
                description="View scheme guidelines, benefits & criteria",
                payload={"scheme_id": context.selected_scheme.scheme_id},
            )
        )

    # 2. Finance / EMI Actions
    if not has_finance or "emi" in msg_lower or "loan" in msg_lower or "ब्याज" in msg_lower or "किस्त" in msg_lower:
        actions.append(
            SuggestedAction(
                action_type="calculate_emi",
                label="🧮 Calculate EMI",
                description="Simulate loan installments and repayment terms",
            )
        )

    # 3. Document Verification Actions
    if has_scheme and (not has_docs or not docs_ready or "doc" in msg_lower or "दस्तावेज़" in msg_lower):
        actions.append(
            SuggestedAction(
                action_type="upload_documents",
                label="📤 Verify Documents",
                description="Upload mandatory certificates for AI OCR validation",
            )
        )
    elif has_docs and docs_ready:
        actions.append(
            SuggestedAction(
                action_type="view_documents",
                label="📑 Document Status",
                description="View verified certificates and readiness score",
            )
        )

    # 4. Partner / Routing Actions
    if "partner" in msg_lower or "bank" in msg_lower or "शाखा" in msg_lower or "बैंक" in msg_lower or not has_partner:
        actions.append(
            SuggestedAction(
                action_type="find_partner",
                label="📍 Nearby Partners",
                description="Locate authorized Nodal Bank branches & route on Mappls",
            )
        )

    # 5. Application Tracking Actions
    if has_app or "status" in msg_lower or "track" in msg_lower or "आवेदन" in msg_lower or "स्थिति" in msg_lower:
        actions.append(
            SuggestedAction(
                action_type="view_application",
                label="⏱ Track Application",
                description="View real-time nodal review timeline and status",
                payload={"application_id": context.application.application_id if has_app else None},
            )
        )

    # Deduplicate actions by action_type and limit to max 3
    unique_actions = []
    seen = set()
    for a in actions:
        if a.action_type not in seen:
            unique_actions.append(a)
            seen.add(a.action_type)
        if len(unique_actions) >= 3:
            break

    return unique_actions


def synthesize_offline_response(
    user_msg: str,
    context: Optional[ChatContext],
    top_schemes: List[Dict[str, Any]],
    language: str,
) -> str:
    """
    Deterministic context-aware offline synthesizer.
    Used as an immediate fallback if Groq API key is unconfigured or cloud API is unavailable.
    """
    msg = (user_msg or "").lower()
    lang = language or "en"

    # Context extractions
    prof = context.profile if context else None
    scheme = context.selected_scheme if context else None
    fin = context.finance if context else None
    docs = context.documents if context else None
    pt = context.partner if context else None
    app = context.application if context else None

    # Intent 1: Scheme Recommendation / "Why recommend?" / "kaunsi scheme"
    if any(k in msg for k in ["kyu", "why", "recommend", "best", "match", "kaunsi", "योजना", "kon si"]):
        if scheme and scheme.scheme_name:
            if lang == "hi":
                return (
                    f"आपकी प्रोफ़ाइल के आधार पर **{scheme.scheme_name}** सबसे उपयुक्त पाई गई है।\n\n"
                    f"• **मंत्रालय:** {scheme.ministry or 'भारत सरकार'}\n"
                    f"• **मुख्य लाभ:** {scheme.benefit or 'वित्तीय सहायता और ऋण अनुदान'}\n"
                    f"• **ऋण सीमा:** {scheme.loan_limit or 'पात्रता अनुसार'}\n\n"
                    "👉 आप नीचे दिए गए **'दस्तावेज़ सत्यापित करें'** बटन से आवश्यक दस्तावेज़ अपलोड करके आगे बढ़ सकते हैं।"
                )
            return (
                f"Based on your profile, **{scheme.scheme_name}** is the top recommended scheme.\n\n"
                f"• **Ministry:** {scheme.ministry or 'Government of India'}\n"
                f"• **Key Benefit:** {scheme.benefit or 'Financial subsidy / low-interest credit'}\n"
                f"• **Loan Limit:** {scheme.loan_limit or 'As per scheme guidelines'}\n\n"
                "👉 You can proceed to upload required documents for OCR verification and partner routing."
            )
        elif top_schemes:
            s0 = top_schemes[0]
            s_name = s0.get("scheme_name", "Government Scheme")
            s_benefit = s0.get("benefit_summary") or s0.get("benefit_amount", "Financial Support")
            if lang == "hi":
                return (
                    f"आपकी खोज के अनुसार, सबसे उपयुक्त योजना **{s_name}** है।\n\n"
                    f"• **लाभ:** {s_benefit}\n"
                    f"• **पात्र श्रेणी:** {', '.join(s0.get('categories', ['SC', 'ST', 'OBC', 'Women']))}\n\n"
                    "विस्तृत जानकारी और ईएमआई सिमुलेशन के लिए आप योजना का चयन कर सकते हैं।"
                )
            return (
                f"Based on your query, the top matching scheme is **{s_name}**.\n\n"
                f"• **Key Benefit:** {s_benefit}\n"
                f"• **Eligible Categories:** {', '.join(s0.get('categories', ['General', 'SC', 'ST', 'Women']))}\n\n"
                "You can select this scheme to simulate EMI and verify your documents."
            )

    # Intent 2: EMI / Finance / "kitni emi" / "loan"
    if any(k in msg for k in ["emi", "loan", "byaj", "interest", "किस्त", "ब्याज", "ऋण", "kist"]):
        if fin and fin.monthly_emi:
            if lang == "hi":
                return (
                    f"आपके द्वारा दर्ज किए गए वित्तीय विवरण के अनुसार अनुमानित EMI गणना:\n\n"
                    f"• **ऋण राशि:** ₹{int(fin.requested_loan or 0):,}\n"
                    f"• **अनुमानित मासिक EMI:** ₹{int(fin.monthly_emi):,}/माह\n"
                    f"• **ब्याज दर:** {fin.interest_rate or 8.5}% वार्षिक\n"
                    f"• **अवधि:** {fin.tenure_years or 5} वर्ष\n\n"
                    "⚠️ *नोट: यह एक सांकेतिक गणना है। अंतिम ब्याज दर और ऋण स्वीकृति अधिकृत बैंक/चैनल पार्टनर द्वारा निर्धारित की जाती है।*"
                )
            return (
                f"Based on your calculated financial plan:\n\n"
                f"• **Loan Amount:** ₹{int(fin.requested_loan or 0):,}\n"
                f"• **Estimated Monthly EMI:** ₹{int(fin.monthly_emi):,}/mo\n"
                f"• **Indicative Interest Rate:** {fin.interest_rate or 8.5}% p.a.\n"
                f"• **Tenure:** {fin.tenure_years or 5} Years\n\n"
                "⚠️ *Note: This is an indicative estimate. Final sanction and terms are determined by the authorized lending institution.*"
            )
        else:
            if lang == "hi":
                return "आप 'Calculate EMI' टूल का उपयोग करके ऋण राशि, ब्याज दर और अवधि के अनुसार अपनी मासिक किस्त (EMI) की सटीक गणना कर सकते हैं।"
            return "You can use the built-in 'Calculate EMI' tool to estimate your monthly installments based on your preferred loan amount and tenure."

    # Intent 3: Documents / "kya missing hai" / "documents"
    if any(k in msg for k in ["doc", "dastavez", "missing", "aadhaar", "pan", "certificate", "दस्तावेज़", "कागजात"]):
        if docs:
            missing_text = ", ".join(docs.missing_documents) if docs.missing_documents else "कोई अनिवार्य दस्तावेज़ शेष नहीं है"
            up_text = ", ".join(docs.uploaded_documents) if docs.uploaded_documents else "अभी तक कोई दस्तावेज़ अपलोड नहीं हुआ"
            if lang == "hi":
                return (
                    f"आपके दस्तावेज़ सत्यापन की वर्तमान स्थिति ({docs.completion_percentage or 0}% पूर्ण):\n\n"
                    f"• **सत्यापित दस्तावेज़:** {up_text}\n"
                    f"• **शेष अनिवार्य दस्तावेज़:** {missing_text}\n\n"
                    f"{'✅ आपके सभी आवश्यक दस्तावेज़ तैयार हैं और आप आवेदन जमा कर सकते हैं।' if docs.is_ready_to_submit else '⚠️ कृपया आवेदन जमा करने से पहले शेष अनिवार्य दस्तावेज़ अपलोड करें।'}"
                )
            return (
                f"Your document verification status ({docs.completion_percentage or 0}% completed):\n\n"
                f"• **Verified Documents:** {', '.join(docs.uploaded_documents) if docs.uploaded_documents else 'None yet'}\n"
                f"• **Missing Mandatory Documents:** {', '.join(docs.missing_documents) if docs.missing_documents else 'All mandatory documents verified'}\n\n"
                f"{'✅ All mandatory documents are verified. Ready for submission.' if docs.is_ready_to_submit else '⚠️ Please upload the remaining mandatory certificates before submitting.'}"
            )
        else:
            if lang == "hi":
                return "योजना के लिए सामान्यतः आधार कार्ड, आय प्रमाण पत्र, जाति प्रमाण पत्र और बैंक पासबुक की आवश्यकता होती है। योजना चुनने के बाद आप गतिशील चेकलिस्ट देख सकते हैं।"
            return "Standard statutory requirements generally include Aadhaar Card, Income Certificate, Category Certificate, and Bank Account details. Select a scheme to view its tailored checklist."

    # Intent 4: Partner / "nearest partner" / "bank"
    if any(k in msg for k in ["partner", "bank", "nearest", "location", "शाखा", "पार्टनर", "नज़दीक"]):
        if pt and pt.partner_name:
            if lang == "hi":
                return (
                    f"आपके लिए निर्धारित / निकटतम चैनल पार्टनर:\n\n"
                    f"• **संस्थान:** {pt.partner_name}\n"
                    f"• **प्रकार:** {pt.partner_type or 'अधिकृत नोडल बैंक शाखा'}\n"
                    f"{f'• **दूरी:** लगभग {pt.distance_km} किमी\n' if pt.distance_km else ''}"
                    f"{f'• **पता:** {pt.address}\n' if pt.address else ''}\n"
                    "यह शाखा आपके आवेदन की भौतिक जांच और ऋण अग्रेषण का कार्य करेगी।"
                )
            return (
                f"Assigned / Recommended Channel Partner:\n\n"
                f"• **Institution:** {pt.partner_name}\n"
                f"• **Category:** {pt.partner_type or 'Authorized Nodal Partner Branch'}\n"
                f"{f'• **Distance:** ~{pt.distance_km} km\n' if pt.distance_km else ''}"
                f"{f'• **Location:** {pt.address}\n' if pt.address else ''}\n"
                "This partner branch handles institutional appraisal and physical verification."
            )
        else:
            if lang == "hi":
                return "आप 'Nearby Help' टैब में Mappls मैप के माध्यम से अपने जिले की अधिकृत नोडल बैंक शाखाएं और चैनल पार्टनर देख सकते हैं।"
            return "You can view nearest authorized Nodal Bank branches and routing on the interactive Mappls map under 'Nearby Help'."

    # Intent 5: Application Status / "application kaha tak pahucha"
    if any(k in msg for k in ["status", "application", "tracking", "kaha tak", "pahucha", "स्थिति", "आवेदन"]):
        if app and app.application_id:
            if lang == "hi":
                return (
                    f"आपके आवेदन की वर्तमान स्थिति:\n\n"
                    f"• **ट्रैकिंग आईडी:** `{app.application_id}`\n"
                    f"• **स्थिति:** {app.status_label or app.status}\n"
                    f"{f'• **अधिकृत पार्टनर:** {app.partner_name}\n' if app.partner_name else ''}"
                    f"• **अगला कदम:** {app.next_step or 'नोडल अधिकारी द्वारा दस्तावेज़ों की जांच की जा रही है।'}\n\n"
                    "आप 'Track Application' स्क्रीन पर पूरा ऑडिट टाइमलाइन देख सकते हैं।"
                )
            return (
                f"Current Status for Application `{app.application_id}`:\n\n"
                f"• **Status:** {app.status_label or app.status}\n"
                f"{f'• **Assigned Partner:** {app.partner_name}\n' if app.partner_name else ''}"
                f"• **Next Milestone:** {app.next_step or 'Document review in progress by Nodal Officer.'}\n\n"
                "You can inspect the full chronological audit timeline under the Status Tracker."
            )
        else:
            if lang == "hi":
                return "वर्तमान सत्र में कोई सक्रिय आवेदन रिकॉर्ड नहीं मिला। यदि आपके पास पहले से ट्रैकिंग आईडी (उदा. `APP-2026-XXXXX`) है, तो आप 'Applications' टैब में इसे खोज सकते हैं।"
            return "No submitted application found in the current session. If you have an existing tracking ID (e.g. `APP-2026-XXXXX`), you can track it via the Applications tab."

    # General Helpful Response
    if lang == "hi":
        return (
            "नमस्ते! मैं **Scheme Saathi AI सहायक** हूँ। मैं आपकी सहायता निम्न कार्यों में कर सकता हूँ:\n\n"
            "1. आपकी प्रोफ़ाइल के अनुसार सरकारी योजनाओं की सिफारिश और पात्रता समझना।\n"
            "2. ऋण राशि और मासिक किस्त (EMI) का सटीक अनुमान लगाना।\n"
            "3. अनिवार्य दस्तावेज़ों की चेकलिस्ट और AI सत्यापन की जांच करना।\n"
            "4. निकटतम अधिकृत चैनल पार्टनर / नोडल बैंक शाखा की पहचान करना।\n"
            "5. आपके आवेदन की वास्तविक स्थिति और अगले चरणों को ट्रैक करना।\n\n"
            "कृपया अपना प्रश्न पूछें!"
        )
    return (
        "Hello! I am your **Scheme Saathi AI Assistant**. I can help you with:\n\n"
        "1. **Scheme Guidance:** Explaining recommendations & eligibility criteria for your business.\n"
        "2. **Financial Estimates:** Calculating EMI, loan limits, and debt burden.\n"
        "3. **Document Readiness:** Checking mandatory certificate checklists & OCR verification.\n"
        "4. **Partner Routing:** Finding authorized Nodal Bank branches on Mappls.\n"
        "5. **Application Tracking:** Monitoring review milestones and next actions.\n\n"
        "How can I assist your enterprise journey today?"
    )


async def generate_chat_response(
    request: ChatRequest,
    db: Optional[AsyncSession] = None,
) -> ChatResponse:
    """
    Main orchestrator for context-aware conversational AI.
    Executes Groq Cloud API with robust privacy filtering, context synthesis, and local fallback.
    """
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    raw_user_msg = request.message.strip()[:MAX_USER_MESSAGE_LENGTH]
    sanitized_msg = mask_sensitive_data(raw_user_msg)

    # 1. Retrieve relevant schemes from FAISS vector store
    top_schemes: List[Dict[str, Any]] = []
    matched_briefs: List[MatchedSchemeBrief] = []

    try:
        all_schemes = await get_all_schemes_cached(db)
        scheme_dict_map = {s["scheme_id"]: s for s in all_schemes if "scheme_id" in s}

        query_vector = encode(sanitized_msg)
        faiss_results = scheme_index.search(query_vector, k=4)

        if faiss_results:
            for s_id, score in faiss_results:
                s_obj = scheme_dict_map.get(s_id)
                if s_obj:
                    scaled_conf = round(min(0.98, max(0.55, float(score))), 2)
                    top_schemes.append(s_obj)
                    matched_briefs.append(
                        MatchedSchemeBrief(
                            scheme_id=s_obj.get("scheme_id", s_id),
                            scheme_name=s_obj.get("scheme_name", "Scheme"),
                            ministry=s_obj.get("ministry"),
                            benefit=s_obj.get("benefit_summary") or s_obj.get("benefit_amount"),
                            confidence=scaled_conf,
                            categories=s_obj.get("categories"),
                            application_url=s_obj.get("application_url"),
                        )
                    )
    except Exception as e:
        logger.debug(f"FAISS vector search skipped or error: {e}")

    # 2. Build Context & System Prompt
    system_instruction = build_system_prompt(request.context, request.language)
    context_text = build_context_block(request.context)

    # Build recent conversation history
    messages_payload = [{"role": "system", "content": system_instruction}]

    if context_text:
        messages_payload.append({
            "role": "system",
            "content": f"### CURRENT USER JOURNEY CONTEXT:\n{context_text}"
        })

    if request.history:
        recent_history = request.history[-MAX_HISTORY_MESSAGES:]
        for h in recent_history:
            role = "user" if h.role == "user" else "assistant"
            messages_payload.append({
                "role": role,
                "content": mask_sensitive_data(h.content),
            })

    messages_payload.append({"role": "user", "content": sanitized_msg})

    # 3. Attempt Groq Cloud API execution
    groq_api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    groq_model = settings.groq_model or os.getenv("GROQ_MODEL") or DEFAULT_GROQ_MODEL

    reply_text: Optional[str] = None
    provider_used = "context_synthesizer"
    model_used = None

    if groq_api_key:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "SchemeSaathi-AI/1.0",
        }

        models_to_try = [groq_model, FALLBACK_GROQ_MODEL]

        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages_payload,
                "temperature": 0.25,
                "max_tokens": 600,
                "top_p": 0.9,
            }

            try:
                async with httpx.AsyncClient(timeout=GROQ_TIMEOUT_SECONDS) as client:
                    resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply_text = data["choices"][0]["message"]["content"].strip()
                        provider_used = "groq_ai"
                        model_used = model
                        logger.info(f"Groq API ({model}) executed successfully.")
                        break
                    else:
                        logger.warning(f"Groq API ({model}) HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.warning(f"Groq API ({model}) connection error: {e}")

    # 4. Fallback to Local Context-Aware Synthesizer if Groq unconfigured or failed
    if not reply_text:
        reply_text = synthesize_offline_response(
            user_msg=sanitized_msg,
            context=request.context,
            top_schemes=top_schemes,
            language=request.language,
        )
        provider_used = "context_synthesizer"

    # 5. Generate Dynamic Suggested Actions
    suggested_actions = generate_suggested_actions(request.context, sanitized_msg)

    elapsed_ms = int((time.time() - start_time) * 1000)
    source_attr = "Groq Cloud Llama-3.3 Intelligence Engine" if provider_used == "groq_ai" else "Scheme Saathi Verified Context Engine"

    return ChatResponse(
        reply=reply_text,
        suggested_actions=suggested_actions,
        matched_schemes=matched_briefs,
        language=request.language,
        session_id=session_id,
        provider=provider_used,
        model_used=model_used,
        processing_time_ms=elapsed_ms,
        source_attribution=source_attr,
    )
