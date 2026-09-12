"""
SIH26092 — Groq AI Chatbot & Context Engine Test Suite.
Verifies context injection, privacy masking, hallucination guards, suggested actions, and fallback synthesis.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from services.groq_service import mask_sensitive_data, build_context_block, generate_suggested_actions
from schemas.chat import ChatContext, ProfileContext, SchemeContext, FinanceContext, DocumentContext, PartnerContext, ApplicationContext

client = TestClient(app)


class TestGroqChatbotPrivacyAndMasking:
    """Tests for PII privacy protection."""

    def test_mask_aadhaar_number(self):
        text = "My Aadhaar number is 1234-5678-9012 and mobile is 9876543210."
        masked = mask_sensitive_data(text)
        assert "1234-5678-9012" not in masked
        assert "XXXX-XXXX-9012" in masked
        assert "9876543210" not in masked
        assert "+91 XXXXX 3210" in masked

    def test_mask_pan_number(self):
        text = "PAN is ABCDE1234F registered."
        masked = mask_sensitive_data(text)
        assert "ABCDE1234F" not in masked
        assert "XXXXX1234F" in masked


class TestGroqChatbotContextEngine:
    """Tests for multi-domain context formatting and suggested actions."""

    def test_context_block_formatting(self):
        ctx = ChatContext(
            profile=ProfileContext(category="SC", income=300000, state="Delhi", business_type="Manufacturing"),
            selected_scheme=SchemeContext(scheme_id="standup-india", scheme_name="Stand-Up India Scheme", loan_limit="₹1 Crore"),
            finance=FinanceContext(requested_loan=1000000, monthly_emi=19566, interest_rate=8.5, tenure_years=5),
            documents=DocumentContext(completion_percentage=80, missing_documents=["Project Report"], is_ready_to_submit=False),
            partner=PartnerContext(partner_name="SBI Connaught Place", distance_km=2.4),
            application=ApplicationContext(application_id="APP-2026-12345", status="under_review", status_label="Under Review by Nodal Officer"),
        )
        summary = build_context_block(ctx)
        assert "Category: SC" in summary
        assert "Stand-Up India Scheme" in summary
        assert "₹19,566" in summary
        assert "Missing Mandatory: Project Report" in summary
        assert "SBI Connaught Place" in summary
        assert "APP-2026-12345" in summary

    def test_suggested_actions_generation(self):
        ctx = ChatContext(
            selected_scheme=SchemeContext(scheme_id="standup-india", scheme_name="Stand-Up India"),
            documents=DocumentContext(is_ready_to_submit=False, missing_documents=["Aadhaar Card"]),
        )
        actions = generate_suggested_actions(ctx, "What documents do I need?")
        action_types = [a.action_type for a in actions]
        assert "upload_documents" in action_types or "view_scheme" in action_types


class TestGroqChatbotEndpoints:
    """Tests for /api/chat endpoint."""

    def test_empty_message_rejected(self):
        resp = client.post("/api/chat", json={"message": "   "})
        assert resp.status_code == 400

    def test_basic_chat_query(self):
        payload = {
            "message": "Hello, how can you help me?",
            "language": "en",
        }
        resp = client.post("/api/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert len(data["reply"]) > 10
        assert data["provider"] in ["groq_ai", "context_synthesizer"]
        assert "session_id" in data
        assert isinstance(data["suggested_actions"], list)

    def test_scheme_inquiry_with_profile_context(self):
        payload = {
            "message": "mere liye kaunsi scheme recommend hui hai?",
            "language": "hi",
            "context": {
                "profile": {
                    "category": "SC",
                    "income": 250000,
                    "state": "Maharashtra",
                    "business_type": "Tailoring",
                },
                "selected_scheme": {
                    "scheme_id": "standup-india",
                    "scheme_name": "Stand-Up India Scheme",
                    "ministry": "Ministry of Finance",
                    "benefit": "Bank loan from ₹10 lakh to ₹1 Crore",
                }
            }
        }
        resp = client.post("/api/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "Stand-Up India" in data["reply"] or "योजना" in data["reply"]

    def test_emi_inquiry_with_finance_context(self):
        payload = {
            "message": "meri EMI kitni hogi?",
            "language": "en",
            "context": {
                "finance": {
                    "requested_loan": 500000,
                    "monthly_emi": 10258,
                    "interest_rate": 8.5,
                    "tenure_years": 5,
                }
            }
        }
        resp = client.post("/api/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "10,258" in data["reply"] or "EMI" in data["reply"]

    def test_document_missing_inquiry_with_document_context(self):
        payload = {
            "message": "mere kaunse documents missing hain?",
            "language": "hi",
            "context": {
                "documents": {
                    "completion_percentage": 50.0,
                    "uploaded_documents": ["Aadhaar Card"],
                    "missing_documents": ["Income Certificate", "Project Report"],
                    "is_ready_to_submit": False,
                }
            }
        }
        resp = client.post("/api/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "Income Certificate" in data["reply"] or "दस्तावेज़" in data["reply"]

    def test_application_status_inquiry_with_application_context(self):
        payload = {
            "message": "mera application status kya hai?",
            "language": "en",
            "context": {
                "application": {
                    "application_id": "APP-2026-99887",
                    "status": "under_review",
                    "status_label": "Under Review by Nodal Officer",
                    "partner_name": "State Bank of India",
                    "next_step": "Branch physical verification",
                }
            }
        }
        resp = client.post("/api/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "APP-2026-99887" in data["reply"]
