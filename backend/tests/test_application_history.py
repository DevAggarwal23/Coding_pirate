import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.application import STATUS_LABELS

client = TestClient(app)


class TestApplicationCreationAndStatusHistory:
    """Tests for application creation and automatic status history logging."""

    def test_create_draft_application(self):
        """Creating an application should initialize history with the first event."""
        payload = {
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India Scheme",
            "partner_id": "sbi-nodal-001",
            "partner_name": "State Bank of India (Nodal Branch)",
            "category": "SC",
            "income": 180000,
            "state": "Maharashtra",
            "business_type": "Manufacturing",
            "notes": "Draft application created by test suite",
        }
        response = client.post("/api/applications", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "application_id" in data
        assert data["application_id"].startswith("APP-2026-")
        assert data["status"] in ["draft", "documents_pending"]
        assert len(data["timeline"]) >= 1
        assert data["timeline"][0]["new_status"] == data["status"]
        assert data["timeline"][0]["changed_by"] == "applicant"

    def test_submit_application_transition_and_history(self):
        """Submitting an application should transition status to 'submitted' and append to history."""
        # 1. Create draft
        create_resp = client.post("/api/applications", json={
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India Scheme",
        })
        assert create_resp.status_code == 201
        app_id = create_resp.json()["application_id"]

        # 2. Submit application
        submit_resp = client.post(f"/api/applications/{app_id}/submit", json={
            "partner_id": "sbi-001",
            "partner_name": "SBI Mumbai Main",
            "notes": "Applicant submitted all verified documents."
        })
        assert submit_resp.status_code == 200
        submit_data = submit_resp.json()
        assert submit_data["status"] == "submitted"
        assert submit_data["submitted_at"] is not None
        assert len(submit_data["timeline"]) >= 2

        # Check last timeline event
        last_event = submit_data["timeline"][-1]
        assert last_event["new_status"] == "submitted"
        assert last_event["changed_by"] == "applicant"

    def test_legacy_submit_endpoint(self):
        """Legacy submit endpoint should work and return timeline."""
        response = client.post("/api/applications/submit", json={
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India Scheme",
            "partner_id": "pnb-002",
            "partner_name": "PNB Connaught Place",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "submitted"
        assert "timeline" in data
        assert len(data["timeline"]) >= 1

    def test_get_application_history(self):
        """GET /api/applications/{id}/history returns complete chronological history."""
        create_resp = client.post("/api/applications", json={
            "scheme_id": "pm-daksh",
            "scheme_name": "PM-DAKSH Scheme",
        })
        app_id = create_resp.json()["application_id"]

        # Submit
        client.post(f"/api/applications/{app_id}/submit", json={"notes": "First submission"})

        # Get History
        hist_resp = client.get(f"/api/applications/{app_id}/history")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert hist_data["application_id"] == app_id
        assert hist_data["current_status"] == "submitted"
        assert len(hist_data["history"]) >= 2
        assert hist_data["history"][0]["new_status"] in ["draft", "documents_pending"]
        assert hist_data["history"][1]["new_status"] == "submitted"

    def test_get_application_status(self):
        """GET /api/applications/{id}/status returns current status, next steps, and timeline."""
        create_resp = client.post("/api/applications", json={
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India",
        })
        app_id = create_resp.json()["application_id"]

        status_resp = client.get(f"/api/applications/{app_id}/status")
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["application_id"] == app_id
        assert "next_step" in data
        assert "estimated_processing" in data
        assert "timeline" in data

    def test_get_application_detail(self):
        """GET /api/applications/{id} returns full application detail with document readiness."""
        create_resp = client.post("/api/applications", json={
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India",
            "category": "SC",
        })
        app_id = create_resp.json()["application_id"]

        detail_resp = client.get(f"/api/applications/{app_id}")
        assert detail_resp.status_code == 200
        data = detail_resp.json()
        assert data["application_id"] == app_id
        assert "document_readiness" in data
        assert "timeline" in data


class TestApplicationLifecycleAndAuthorization:
    """Tests for status transitions, lifecycle checks, and role permissions."""

    def test_applicant_cannot_self_approve(self):
        """Applicant cannot transition status to 'approved' (HTTP 403)."""
        create_resp = client.post("/api/applications", json={"scheme_id": "standup-india"})
        app_id = create_resp.json()["application_id"]

        trans_resp = client.post(f"/api/applications/{app_id}/transition", json={
            "new_status": "approved",
            "changed_by": "applicant",
            "note": "Applicant trying to self-approve",
        })
        assert trans_resp.status_code == 403
        assert "not authorized" in trans_resp.json()["detail"].lower()

    def test_applicant_cannot_self_reject_or_disburse(self):
        """Applicant cannot transition status to 'rejected' or 'disbursed' (HTTP 403)."""
        create_resp = client.post("/api/applications", json={"scheme_id": "standup-india"})
        app_id = create_resp.json()["application_id"]

        for forbidden_status in ["rejected", "disbursed", "under_review"]:
            trans_resp = client.post(f"/api/applications/{app_id}/transition", json={
                "new_status": forbidden_status,
                "changed_by": "applicant",
            })
            assert trans_resp.status_code == 403

    def test_partner_or_nodal_officer_can_review_and_approve(self):
        """Nodal officer / partner can transition status to 'under_review' and 'approved'."""
        create_resp = client.post("/api/applications", json={"scheme_id": "standup-india"})
        app_id = create_resp.json()["application_id"]

        # 1. Submit
        client.post(f"/api/applications/{app_id}/submit")

        # 2. Officer sets to under_review
        rev_resp = client.post(f"/api/applications/{app_id}/transition", json={
            "new_status": "under_review",
            "changed_by": "nodal_officer",
            "note": "Document scrutiny initiated by SBI Lead District Manager.",
        })
        assert rev_resp.status_code == 200
        assert rev_resp.json()["status"] == "under_review"

        # 3. Officer approves
        appr_resp = client.post(f"/api/applications/{app_id}/transition", json={
            "new_status": "approved",
            "changed_by": "nodal_officer",
            "note": "All documents verified in person. Sanction letter generated.",
        })
        assert appr_resp.status_code == 200
        assert appr_resp.json()["status"] == "approved"

        # 4. Officer records disbursement
        disb_resp = client.post(f"/api/applications/{app_id}/transition", json={
            "new_status": "disbursed",
            "changed_by": "channel_partner",
            "note": "Term loan credited to beneficiary account.",
        })
        assert disb_resp.status_code == 200
        assert disb_resp.json()["status"] == "disbursed"

        # Verify full timeline length
        hist = client.get(f"/api/applications/{app_id}/history").json()
        assert len(hist["history"]) >= 4

    def test_invalid_status_rejected(self):
        """Invalid status name should return HTTP 400."""
        create_resp = client.post("/api/applications", json={"scheme_id": "standup-india"})
        app_id = create_resp.json()["application_id"]

        trans_resp = client.post(f"/api/applications/{app_id}/transition", json={
            "new_status": "super_approved",
            "changed_by": "admin",
        })
        assert trans_resp.status_code == 400

    def test_nonexistent_application_404(self):
        """Non-existent application should return HTTP 404."""
        resp = client.get("/api/applications/APP-9999-NONEXISTENT/status")
        assert resp.status_code == 404

        hist_resp = client.get("/api/applications/APP-9999-NONEXISTENT/history")
        assert hist_resp.status_code == 404