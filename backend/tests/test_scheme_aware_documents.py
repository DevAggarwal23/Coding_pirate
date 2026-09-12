import io
import pytest
from fastapi.testclient import TestClient
from main import app
from services.document_service import (
    get_scheme_checklist,
    get_why_required_explanation,
    save_uploaded_document,
    calculate_application_readiness,
    delete_uploaded_document,
    _IN_MEMORY_DOCUMENTS,
)

client = TestClient(app)

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n" + b"A" * 200
SAMPLE_PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82" + b"B" * 200


def test_1_fetch_checklist_by_scheme():
    """Verify GET /api/documents/checklist/{scheme_id} returns structured requirements."""
    resp = client.get("/api/documents/checklist/standup-india")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scheme_id"] == "standup-india"
    assert data["total_documents"] >= 5
    assert "checklist" in data
    assert "completion" in data
    assert data["completion"]["required"] >= 4


def test_2_correct_documents_returned_for_different_schemes():
    """Verify different schemes return different statutory requirements."""
    resp_sui = client.get("/api/documents/checklist/standup-india")
    resp_pmegp = client.get("/api/documents/checklist/pmegp")
    assert resp_sui.status_code == 200
    assert resp_pmegp.status_code == 200

    sui_names = [d["document_name"] for d in resp_sui.json()["checklist"]]
    pmegp_names = [d["document_name"] for d in resp_pmegp.json()["checklist"]]

    assert any("Stand-Up" in s or "Lease" in s or "DPR" in s for s in sui_names)
    assert any("Education" in p or "Rural" in p or "margin money" in str(p).lower() for p in pmegp_names)


def test_3_mandatory_vs_optional_logic():
    """Verify requirements clearly distinguish mandatory from optional items."""
    resp = client.get("/api/documents/checklist/standup-india")
    data = resp.json()
    mandatory_items = [d for d in data["checklist"] if d["mandatory"]]
    optional_items = [d for d in data["checklist"] if not d["mandatory"]]

    assert len(mandatory_items) > 0
    assert len(optional_items) >= 1
    assert optional_items[0]["mandatory"] is False
    assert "optional" in optional_items[0]["document_type"] or "udyam" in optional_items[0]["document_name"].lower()


def test_4_why_is_this_document_required_explanation():
    """Verify each document requirement contains a non-fabricated purpose explanation."""
    resp = client.get("/api/documents/checklist/standup-india")
    data = resp.json()
    for doc in data["checklist"]:
        assert "why_required" in doc
        assert len(doc["why_required"]) > 10
        if "Aadhaar" in doc["document_name"]:
            assert "identity" in doc["why_required"].lower()
        if "Bank" in doc["document_name"]:
            assert "disbursement" in doc["why_required"].lower() or "dbt" in doc["why_required"].lower()


def test_5_source_and_provenance_metadata():
    """Verify requirement provenance and verification status."""
    resp = client.get("/api/documents/checklist/standup-india")
    data = resp.json()
    for doc in data["checklist"]:
        assert doc.get("verification_status") in ["VERIFIED", "DEMO", "official_dataset", "curated"]
        assert doc.get("max_file_size_mb") == 20
        assert "pdf" in doc.get("accepted_formats", [])


def test_6_upload_document_success():
    """Verify POST /api/documents/upload succeeds for valid PDF."""
    files = {"file": ("aadhaar_proof.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {
        "requirement_id": "req-aadhaar",
        "document_name": "Aadhaar Card",
        "document_type": "identity_proof",
        "scheme_id": "standup-india",
    }
    resp = client.post("/api/documents/upload", files=files, data=data)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["is_valid"] is True
    assert res_data["document_id"].startswith("DOC-2026-")
    assert res_data["status"].startswith("uploaded")


def test_7_reject_unsupported_file_type():
    """Verify upload rejects executable or unsupported file types."""
    files = {"file": ("malicious.exe", b"MZ\x90\x00" + b"X" * 200, "application/x-msdownload")}
    data = {"requirement_id": "req-aadhaar", "document_name": "Aadhaar"}
    resp = client.post("/api/documents/upload", files=files, data=data)
    assert resp.status_code == 415


def test_8_reject_empty_and_oversized_file():
    """Verify upload rejects empty files (<100B) and oversized files (>20MB)."""
    # Empty file
    files_empty = {"file": ("empty.pdf", b"too small", "application/pdf")}
    resp_empty = client.post("/api/documents/upload", files=files_empty, data={"requirement_id": "req-1"})
    assert resp_empty.status_code == 400

    # Oversized file
    oversized_bytes = b"%PDF-1.4\n" + b"X" * (21 * 1024 * 1024)
    files_big = {"file": ("big.pdf", oversized_bytes, "application/pdf")}
    resp_big = client.post("/api/documents/upload", files=files_big, data={"requirement_id": "req-1"})
    assert resp_big.status_code == 413


def test_9_readiness_calculation_and_missing_mandatory():
    """Verify application readiness correctly detects missing mandatory documents."""
    # Scenario 1: Only 1 document provided
    resp_incomplete = client.post(
        "/api/documents/readiness",
        json={
            "scheme_id": "standup-india",
            "provided_documents": ["Aadhaar Card / Government Identity Proof"],
        },
    )
    assert resp_incomplete.status_code == 200
    data_inc = resp_incomplete.json()
    assert data_inc["is_ready_to_submit"] is False
    assert data_inc["readiness_percentage"] < 100.0
    assert len(data_inc["missing_required_documents"]) > 0

    # Scenario 2: All mandatory provided
    req_items = get_scheme_checklist("standup-india")["required_documents"]
    all_mandatory_names = [d["document_name"] for d in req_items]

    resp_complete = client.post(
        "/api/documents/readiness",
        json={
            "scheme_id": "standup-india",
            "provided_documents": all_mandatory_names,
        },
    )
    assert resp_complete.status_code == 200
    data_comp = resp_complete.json()
    assert data_comp["is_ready_to_submit"] is True
    assert data_comp["readiness_percentage"] == 100.0
    assert len(data_comp["missing_required_documents"]) == 0


def test_10_upload_does_not_claim_government_sanction():
    """Verify status is clearly 'uploaded' / pending scrutiny, never 'government approved'."""
    files = {"file": ("project_dpr.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {
        "requirement_id": "req-dpr",
        "document_name": "Detailed Project Report",
        "scheme_id": "standup-india",
    }
    resp = client.post("/api/documents/upload", files=files, data=data)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["status"] not in ["approved", "sanctioned", "government_verified"]
    assert res_data["status"].startswith("uploaded")


def test_11_application_document_upload_and_list():
    """Verify uploading a document attached directly to an application."""
    app_id = "APP-2026-TESTDOC"
    files = {"file": ("bank_statement.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {
        "requirement_id": "req-bank",
        "document_name": "Bank Statement",
        "scheme_id": "standup-india",
    }
    resp = client.post(f"/api/applications/{app_id}/documents", files=files, data=data)
    assert resp.status_code == 200
    doc_id = resp.json()["document_id"]

    # Fetch application documents
    list_resp = client.get(f"/api/applications/{app_id}/documents?scheme_id=standup-india")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["application_id"] == app_id
    assert len(list_data["documents"]) >= 1
    assert any(d["id"] == doc_id for d in list_data["documents"])


def test_12_document_replacement():
    """Verify uploading a document for the same requirement replaces the previous file."""
    app_id = "APP-2026-REPLACE"
    files_v1 = {"file": ("v1.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {
        "requirement_id": "req-aadhaar",
        "document_name": "Aadhaar Card",
        "scheme_id": "standup-india",
    }
    r1 = client.post(f"/api/applications/{app_id}/documents", files=files_v1, data=data)
    assert r1.status_code == 200
    doc1_id = r1.json()["document_id"]

    # Upload replacement file v2
    files_v2 = {"file": ("v2_updated.pdf", SAMPLE_PDF_BYTES + b"_new", "application/pdf")}
    r2 = client.post(f"/api/applications/{app_id}/documents", files=files_v2, data=data)
    assert r2.status_code == 200
    doc2_id = r2.json()["document_id"]

    # Check list has only 1 active document for req-aadhaar
    list_resp = client.get(f"/api/applications/{app_id}/documents")
    docs = [d for d in list_resp.json()["documents"] if d["requirement_id"] == "req-aadhaar"]
    assert len(docs) == 1
    assert docs[0]["original_filename"] == "v2_updated.pdf"


def test_13_document_deletion():
    """Verify deleting an uploaded document removes it from application checklist."""
    app_id = "APP-2026-DEL"
    files = {"file": ("to_delete.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {"requirement_id": "req-del", "document_name": "Temporary Doc"}
    r = client.post(f"/api/applications/{app_id}/documents", files=files, data=data)
    doc_id = r.json()["document_id"]

    # Delete document
    del_resp = client.delete(f"/api/applications/{app_id}/documents/{doc_id}")
    assert del_resp.status_code == 200

    # Ensure document no longer listed
    list_resp = client.get(f"/api/applications/{app_id}/documents")
    assert not any(d["id"] == doc_id for d in list_resp.json()["documents"])


def test_14_indexed_schemes_dynamic_checklist():
    """Verify any arbitrary indexed scheme (e.g. KG0003) gets dynamic checklist from JSON dataset."""
    resp = client.get("/api/documents/checklist/KG0003")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["checklist"]) > 0
    assert data["completion"]["required"] > 0
    for doc in data["checklist"]:
        assert "why_required" in doc
        assert doc["why_required"] is not None
