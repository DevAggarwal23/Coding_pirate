"""
Full E2E Verification Script for Scheme_Saathi SIH26092.
Tests all 8 core API endpoints using FastAPI TestClient with lifespan context manager.
"""
import sys
import os
sys.path.insert(0, os.path.abspath("e:/SIH/backend"))

from fastapi.testclient import TestClient
from main import app

def safe_str(val):
    if isinstance(val, str):
        return val.encode("ascii", errors="replace").decode("ascii")
    return str(val)

def test_full_pipeline():
    with TestClient(app) as client:
        print("=" * 70)
        print("STARTING FULL SIH26092 E2E VERIFICATION")
        print("=" * 70)

        # 1. Health Check
        res = client.get("/api/health")
        print(f"\n[1/8] GET /api/health -> HTTP {res.status_code}")
        print(f"      Response: {safe_str(res.json())}")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
        assert res.json()["faiss_index"] == "loaded"
        assert res.json()["schemes_indexed"] >= 400

        # 2. NLP Profile Extraction
        golden_prompt = "Main SC category se hoon, meri family income 3 lakh hai. Uttar Pradesh mein dairy business start karna chahta hoon aur mujhe 5 lakh ki financial assistance chahiye."
        res = client.post("/api/profile/extract", json={"text": golden_prompt})
        print(f"\n[2/8] POST /api/profile/extract -> HTTP {res.status_code}")
        profile = res.json()["extracted"]
        print(f"      Extracted: {safe_str(profile)}")
        assert res.status_code == 200
        assert profile["category"] == "SC"
        assert profile["income"] == 300000
        assert profile["state"] == "Uttar Pradesh"
        assert profile["business_type"] == "dairy"
        assert profile["project_cost"] == 500000

        # 3. AI Scheme Matching (Dense Vector Search + Hard Rules)
        res = client.post("/api/match/schemes", json=profile)
        print(f"\n[3/8] POST /api/match/schemes -> HTTP {res.status_code}")
        match_data = res.json()
        auto_matched = match_data["auto_matched"]
        print(f"      Auto-matched: {len(auto_matched)} schemes (Total checked: {match_data['total_schemes_checked']})")
        for s in auto_matched[:3]:
            print(f"      - {safe_str(s['scheme_name'])} (Confidence: {s['confidence']}) -> {safe_str(s['why_matched'])}")
        assert res.status_code == 200
        assert len(auto_matched) > 0

        # 4. Financial EMI Calculator
        res = client.post("/api/finance/calculate-emi", json={
            "principal": 500000,
            "annual_interest_rate": 4.0,
            "tenure_months": 60
        })
        print(f"\n[4/8] POST /api/finance/calculate-emi -> HTTP {res.status_code}")
        emi_data = res.json()
        print(f"      Monthly EMI: Rs.{emi_data['monthly_emi']} | Total Repayment: Rs.{emi_data['total_repayment']}")
        assert res.status_code == 200
        assert emi_data["monthly_emi"] > 0

        # 5. Channel Partners Routing
        res = client.get("/api/finance/partners?state=Uttar%20Pradesh&category=SC")
        print(f"\n[5/8] GET /api/finance/partners -> HTTP {res.status_code}")
        partners = res.json()["partners"]
        print(f"      Found {len(partners)} channel partners for UP / SC")
        assert res.status_code == 200
        assert len(partners) > 0

        # 6. Document Readiness
        res = client.post("/api/finance/document-readiness", json={
            "scheme_id": "standup-india",
            "provided_documents": ["Aadhaar Card", "Caste Certificate (SC/ST) or Gender proof (Women)"]
        })
        print(f"\n[6/8] POST /api/finance/document-readiness -> HTTP {res.status_code}")
        readiness = res.json()
        print(f"      Readiness: {readiness['readiness_percentage']}% (Missing: {len(readiness['missing_documents'])})")
        assert res.status_code == 200

        # 7. Application Submission
        res = client.post("/api/applications/submit", json={
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India",
            "category": "SC",
            "income": 300000,
            "state": "Uttar Pradesh",
            "business_type": "dairy"
        })
        print(f"\n[7/8] POST /api/applications/submit -> HTTP {res.status_code}")
        app_res = res.json()
        app_id = app_res["application_id"]
        print(f"      Submitted Application ID: {app_id} (Status: {app_res['status']})")
        assert res.status_code == 200
        assert app_id.startswith("APP-")

        # 8. Application Status Tracking
        res = client.get(f"/api/applications/{app_id}/status")
        print(f"\n[8/8] GET /api/applications/{app_id}/status -> HTTP {res.status_code}")
        status_data = res.json()
        print(f"      Tracked Status: {status_data['status']} | Scheme: {safe_str(status_data['scheme_name'])}")
        assert res.status_code == 200
        assert status_data["application_id"] == app_id

        print("\n" + "=" * 70)
        print("SUCCESS: ALL 8 E2E ENDPOINTS PASSED WITH 100% SUCCESS!")
        print("=" * 70)

if __name__ == "__main__":
    test_full_pipeline()
