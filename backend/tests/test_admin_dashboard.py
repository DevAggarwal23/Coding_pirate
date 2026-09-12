import pytest
from fastapi.testclient import TestClient
from main import app
from core.dependencies import issue_admin_token, get_db

# Override get_db to return None in unit tests
async def override_get_db():
    yield None

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_admin_auth_protection():
    """Verify unauthorized requests are rejected."""
    res = client.get("/api/admin/metrics")
    assert res.status_code in [401, 403]

    res = client.get("/api/admin/schemes", headers={"Authorization": "Bearer invalid_token_12345"})
    assert res.status_code in [401, 403]


def test_admin_login_success():
    """Verify admin login with valid credentials."""
    res = client.post("/api/admin/auth/login", json={
        "email": "admin@schemesaathi.gov.in",
        "password": "Admin@SIH2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data or "access_token" in data
    assert data["email"] == "admin@schemesaathi.gov.in"
    assert data["role"] == "super_admin"


def test_admin_login_invalid():
    """Verify admin login with invalid credentials fails."""
    res = client.post("/api/admin/auth/login", json={
        "email": "admin@schemesaathi.gov.in",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401


def test_admin_me_endpoint():
    """Verify /api/admin/auth/me returns admin profile."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    res = client.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "admin@schemesaathi.gov.in"
    assert data["role"] == "super_admin"


def test_admin_metrics_real_data():
    """Verify operational metrics returns aggregated statistics."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    res = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_schemes"] >= 5
    assert "total_applications" in data
    assert "applications_by_status" in data
    assert "submitted" in data["applications_by_status"]
    assert "total_channel_partners" in data
    assert data["system_health"] == "HEALTHY"


def test_admin_schemes_list_and_update():
    """Verify admin can list and update scheme details."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/admin/schemes", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    scheme_id = data["schemes"][0]["scheme_id"]

    # Update scheme
    update_res = client.put(
        f"/api/admin/schemes/{scheme_id}",
        headers=headers,
        json={"is_active": True}
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["scheme_id"] == scheme_id


def test_admin_scheme_requirements():
    """Verify admin can inspect and update document requirements."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/schemes/PMMY_SHISHU/requirements", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "requirements" in data
    assert len(data["requirements"]) > 0

    # Update requirements
    update_res = client.put(
        "/api/admin/schemes/PMMY_SHISHU/requirements",
        headers=headers,
        json={
            "requirements": [
                {
                    "doc_type": "aadhaar",
                    "title": "Aadhaar Card",
                    "mandatory": True,
                    "description": "Proof of Identity",
                    "valid_formats": ["jpg", "png", "pdf"],
                    "ocr_validation_fields": ["aadhaar_number", "name", "dob"]
                }
            ]
        }
    )
    assert update_res.status_code == 200


def test_admin_partners_list():
    """Verify channel partner directory listing."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    res = client.get("/api/admin/partners", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["partners"]) >= 1


def test_admin_application_review_flow():
    """Verify full application submission, listing, inspection, and nodal status transition."""
    # 1. Create an application
    sub_res = client.post("/api/applications/submit", json={
        "scheme_id": "PMMY_SHISHU",
        "applicant_name": "Test Beneficiary Admin Suite",
        "phone": "9876543210",
        "state": "Maharashtra",
        "category": "OBC",
        "partner_id": "sbi-001",
        "requested_amount": 45000,
        "business_type": "Retail"
    })
    assert sub_res.status_code == 200
    app_id = sub_res.json()["application_id"]

    admin_token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    nodal_token = issue_admin_token("nodal.officer@schemesaathi.gov.in", "nodal_officer", "Nodal Review Officer")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    nodal_headers = {"Authorization": f"Bearer {nodal_token}"}

    # 2. List applications as admin
    list_res = client.get("/api/admin/applications", headers=admin_headers)
    assert list_res.status_code == 200
    apps = list_res.json()["applications"]
    assert any(a["application_id"] == app_id for a in apps)

    # 3. View detail
    detail_res = client.get(f"/api/admin/applications/{app_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    app_detail = detail_res.json()
    assert app_detail["application_id"] == app_id
    assert "timeline" in app_detail

    # 4. Transition to under_review
    tr1 = client.post(
        f"/api/admin/applications/{app_id}/transition",
        headers=nodal_headers,
        json={
            "to_status": "under_review",
            "remarks": "Documents verified by nodal officer. Verification in progress."
        }
    )
    assert tr1.status_code == 200
    assert tr1.json()["current_status"] == "under_review"

    # 5. Transition to approved
    tr2 = client.post(
        f"/api/admin/applications/{app_id}/transition",
        headers=nodal_headers,
        json={
            "to_status": "approved",
            "remarks": "Loan application approved after physical inspection and CIBIL verification.",
            "sanctioned_amount": 45000.0
        }
    )
    assert tr2.status_code == 200
    assert tr2.json()["current_status"] == "approved"

    # 6. Verify timeline in public status API reflects the nodal update
    status_res = client.get(f"/api/applications/{app_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "approved"


def test_admin_audit_logs():
    """Verify audit logs are logged and retrievable."""
    token = issue_admin_token("admin@schemesaathi.gov.in", "super_admin", "System Administrator")
    res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "logs" in data
    assert len(data["logs"]) > 0
    assert any(log["actor_email"] in ["admin@schemesaathi.gov.in", "nodal.officer@schemesaathi.gov.in", "system@schemesaathi.gov.in"] for log in data["logs"])
