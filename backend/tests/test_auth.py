import os
import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from core.config import settings


@pytest.mark.asyncio
async def test_auth_config_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/auth/config")
        assert resp.status_code == 200
        data = resp.json()
        assert "google_client_id" in data
        assert "environment" in data
        # Ensure server secrets are NEVER exposed in auth config
        assert "google_client_secret" not in data
        assert "secret_key" not in data
        assert "groq_api_key" not in data


@pytest.mark.asyncio
async def test_google_auth_success_in_testing_env(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "id_token": "test_google_token_:goog_sub_applicant_1:applicant.one@example.com:Ramesh Kumar"
        }
        resp = await client.post("/api/auth/google", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        user = data["user"]
        assert user["email"] == "applicant.one@example.com"
        assert user["name"] == "Ramesh Kumar"
        assert user["role"] == "applicant"  # Enforced applicant role


@pytest.mark.asyncio
async def test_google_auth_test_token_rejected_in_production_env(monkeypatch):
    # When in production or development, deterministic test tokens MUST be rejected
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "environment", "production")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "id_token": "test_google_token_:goog_sub_fake:hacker@example.com:Hacker"
        }
        resp = await client.post("/api/auth/google", json=payload)
        assert resp.status_code == 401
        assert "strictly prohibited" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_duplicate_google_sub_prevents_duplicate_accounts(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First Login
        resp1 = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_stable_101:stable.user@example.com:Stable User"}
        )
        assert resp1.status_code == 200
        user1_id = resp1.json()["user"]["id"]

        # Second Login with same Google sub
        resp2 = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_stable_101:stable.user@example.com:Stable User Updated"}
        )
        assert resp2.status_code == 200
        user2_id = resp2.json()["user"]["id"]

        # Must map to the exact same internal user record
        assert user1_id == user2_id


@pytest.mark.asyncio
async def test_session_restoration_get_me(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_sunita:sunita.devi@example.com:Sunita Devi"}
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        # Restore session via GET /api/auth/me
        me_resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        user = me_resp.json()
        assert user["email"] == "sunita.devi@example.com"
        assert user["name"] == "Sunita Devi"


@pytest.mark.asyncio
async def test_session_restoration_without_token():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_session_restoration_invalid_token():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer usr_non_existent_token_9999"}
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout_session_revocation(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login
        login_resp = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_logout_test:logout.test@example.com:Logout Tester"}
        )
        token = login_resp.json()["access_token"]

        # 2. Verify active session
        me_active = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_active.status_code == 200

        # 3. Call server logout endpoint
        logout_resp = await client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_resp.status_code == 200
        assert logout_resp.json()["status"] == "success"

        # 4. Token must now be completely revoked
        me_revoked = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_revoked.status_code == 401


@pytest.mark.asyncio
async def test_applicant_cannot_access_admin_endpoint(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_regular:regular.applicant@example.com:Regular Applicant"}
        )
        token = login_resp.json()["access_token"]

        # Attempt to access privileged admin route
        admin_resp = await client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {token}"})
        assert admin_resp.status_code == 403


@pytest.mark.asyncio
async def test_application_ownership_isolation(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. User A logs in and creates an application
        login_a = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_isolated_a:user.alpha@example.com:User Alpha"}
        )
        token_a = login_a.json()["access_token"]

        create_resp = await client.post(
            "/api/applications",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"scheme_id": "standup-india", "scheme_name": "Stand-Up India"}
        )
        assert create_resp.status_code == 201
        app_id = create_resp.json()["application_id"]

        # 2. User B logs in
        login_b = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_isolated_b:user.beta@example.com:User Beta"}
        )
        token_b = login_b.json()["access_token"]

        # 3. User B attempts to access User A's application -> 403 Forbidden
        denied_resp = await client.get(f"/api/applications/{app_id}", headers={"Authorization": f"Bearer {token_b}"})
        assert denied_resp.status_code == 403

        # 4. User A accesses own application -> 200 OK
        allowed_resp = await client.get(f"/api/applications/{app_id}", headers={"Authorization": f"Bearer {token_a}"})
        assert allowed_resp.status_code == 200
        assert allowed_resp.json()["application_id"] == app_id


@pytest.mark.asyncio
async def test_document_ownership_isolation(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User A creates application
        login_a = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_doc_a:doc.owner.a@example.com:Doc Owner A"}
        )
        token_a = login_a.json()["access_token"]

        app_resp = await client.post(
            "/api/applications",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"scheme_id": "pmsvanidhi", "scheme_name": "PM SVANidhi"}
        )
        app_id = app_resp.json()["application_id"]

        # User B logs in
        login_b = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_doc_b:doc.owner.b@example.com:Doc Owner B"}
        )
        token_b = login_b.json()["access_token"]

        # User B tries to view documents of User A's application -> 403 Forbidden
        doc_view_resp = await client.get(
            f"/api/applications/{app_id}/documents",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert doc_view_resp.status_code == 403


@pytest.mark.asyncio
async def test_applicant_cannot_self_approve_application(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "testing")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.post(
            "/api/auth/google",
            json={"id_token": "test_google_token_:goog_sub_self_approver:self.approver@example.com:Self Approver"}
        )
        token = login_resp.json()["access_token"]

        app_resp = await client.post(
            "/api/applications",
            headers={"Authorization": f"Bearer {token}"},
            json={"scheme_id": "pm-daksh", "scheme_name": "PM-DAKSH"}
        )
        app_id = app_resp.json()["application_id"]

        # Self-approval attempt -> 403 Forbidden
        trans_resp = await client.post(
            f"/api/applications/{app_id}/transition",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_status": "approved", "changed_by": "applicant"}
        )
        assert trans_resp.status_code == 403
