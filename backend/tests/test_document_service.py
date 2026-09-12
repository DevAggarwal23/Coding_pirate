import pytest
import sys
import os
import io

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from services.document_service import (
    get_scheme_checklist,
    save_uploaded_document,
    calculate_application_readiness,
    get_application_documents,
    get_document_by_id,
    check_document_readiness,
    get_scheme_required_documents,
)

client = TestClient(app)

VALID_PDF_BYTES = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Root 1 0 R >>\n%%EOF' + b'0' * 100
VALID_PNG_BYTES = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4' + b'0' * 100
VALID_JPG_BYTES = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x00\x00\x00\xff\xdb\x00C\x00' + b'0' * 100
INVALID_EXE_BYTES = b'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00' + b'0' * 100


class TestDocumentChecklists:

    def test_get_scheme_checklist_standup_india(self):
        checklist = get_scheme_checklist('standup-india')
        assert checklist['scheme_id'] == 'standup-india'
        assert checklist['total_documents_count'] > 0
        assert checklist['required_count'] >= 3
        assert checklist['optional_count'] >= 1

        req_items = [item for item in checklist['checklist'] if item['is_required']]
        opt_items = [item for item in checklist['checklist'] if not item['is_required']]
        assert len(req_items) == checklist['required_count']
        assert len(opt_items) == checklist['optional_count']

        aadhaar_item = next((i for i in checklist['checklist'] if 'aadhaar' in i['requirement_id']), None)
        assert aadhaar_item is not None
        assert aadhaar_item['is_required'] is True

    def test_get_scheme_checklist_pmegp(self):
        checklist = get_scheme_checklist('pmegp')
        assert checklist['scheme_id'] == 'pmegp'
        assert checklist['required_count'] >= 3
        proj_item = next((i for i in checklist['checklist'] if 'project' in i['requirement_id']), None)
        assert proj_item is not None
        assert proj_item['is_required'] is True

    def test_get_scheme_checklist_dataset_fallback_kg0001(self):
        checklist = get_scheme_checklist('KG0001')
        assert checklist['scheme_id'] == 'KG0001'
        assert len(checklist['checklist']) > 0
        assert checklist['data_mode'] == 'demo'
        assert 'provenance_notice' in checklist

    def test_checklist_fastapi_endpoint(self):
        response = client.get('/api/documents/checklist/standup-india')
        assert response.status_code == 200
        data = response.json()
        assert data['scheme_id'] == 'standup-india'
        assert 'checklist' in data
        assert len(data['checklist']) > 0

    def test_checklist_default_all_schemes(self):
        response = client.get('/api/documents/checklist')
        assert response.status_code == 200
        data = response.json()
        assert 'checklist' in data


class TestDocumentUploadValidation:

    def test_upload_valid_pdf(self):
        doc = save_uploaded_document(
            file_bytes=VALID_PDF_BYTES,
            filename='aadhaar_card.pdf',
            requirement_id='req_aadhaar',
            document_name='Aadhaar Card',
            document_type='identity',
            application_id='APP-2026-TEST01',
            scheme_id='standup-india',
        )
        assert doc['status'] == 'uploaded_pending_nodal_verification'
        assert doc['content_type'] == 'application/pdf'
        assert doc['is_valid'] is True
        assert doc['original_filename'] == 'aadhaar_card.pdf'
        assert doc['file_size'] == len(VALID_PDF_BYTES)
        assert os.path.exists(doc['file_path'])

    def test_upload_valid_png_and_jpeg(self):
        png_doc = save_uploaded_document(
            file_bytes=VALID_PNG_BYTES,
            filename='caste_cert.png',
            requirement_id='req_caste',
            document_name='Caste Certificate',
            document_type='caste_certificate',
        )
        assert png_doc['content_type'] == 'image/png'
        assert png_doc['is_valid'] is True

        jpg_doc = save_uploaded_document(
            file_bytes=VALID_JPG_BYTES,
            filename='pan_card.jpg',
            requirement_id='req_pan',
            document_name='PAN Card',
            document_type='pan_card',
        )
        assert jpg_doc['content_type'] == 'image/jpeg'
        assert jpg_doc['is_valid'] is True

    def test_reject_unsupported_file_extension(self):
        with pytest.raises(Exception) as exc_info:
            save_uploaded_document(
                file_bytes=INVALID_EXE_BYTES,
                filename='malicious.exe',
                requirement_id='req_doc',
            )
        assert 'Unsupported file type' in str(exc_info.value)

    def test_reject_corrupt_or_empty_file(self):
        with pytest.raises(Exception) as exc_info:
            save_uploaded_document(
                file_bytes=b'empty',
                filename='empty.pdf',
                requirement_id='req_doc',
            )
        assert 'empty' in str(exc_info.value).lower() or 'corrupt' in str(exc_info.value).lower()


    def test_reject_file_exceeding_size_limit(self):
        huge_bytes = b'%PDF-1.4' + b'0' * (21 * 1024 * 1024)
        with pytest.raises(Exception) as exc_info:
            save_uploaded_document(
                file_bytes=huge_bytes,
                filename='huge.pdf',
                requirement_id='req_doc',
            )
        assert 'exceeds maximum allowed limit' in str(exc_info.value)

    def test_fastapi_upload_endpoint_pdf(self):
        files = {
            'file': ('project_report.pdf', io.BytesIO(VALID_PDF_BYTES), 'application/pdf')
        }
        data = {
            'requirement_id': 'req_project_report',
            'document_name': 'Project Report',
            'document_type': 'project_report',
            'application_id': 'APP-2026-UPLOAD01',
            'scheme_id': 'pmegp',
        }
        response = client.post('/api/documents/upload', files=files, data=data)
        assert response.status_code == 200
        res = response.json()
        assert res['document_id'].startswith('DOC-')
        assert res['status'] == 'uploaded_pending_nodal_verification'
        assert res['requirement_id'] == 'req_project_report'
        assert res['original_filename'] == 'project_report.pdf'

    def test_fastapi_upload_endpoint_invalid_file_type(self):
        files = {
            'file': ('virus.exe', io.BytesIO(INVALID_EXE_BYTES), 'application/x-msdownload')
        }
        data = {'requirement_id': 'req_test'}
        response = client.post('/api/documents/upload', files=files, data=data)
        assert response.status_code == 415


class TestDocumentReadinessEngine:

    def test_readiness_initial_no_documents(self):
        res = calculate_application_readiness(
            scheme_id='standup-india',
            provided_documents=[],
            uploaded_requirements=[],
        )
        assert res['is_ready_to_submit'] is False
        assert res['readiness_percentage'] == 0.0
        assert res['status'] == 'incomplete'
        assert len(res['missing_required_documents']) >= 3
        assert 'Upload all mandatory documents' in res['next_action']

    def test_readiness_partial_mandatory_upload(self):
        res = calculate_application_readiness(
            scheme_id='standup-india',
            provided_documents=['Aadhaar Card'],
            uploaded_requirements=['req_aadhaar'],
        )
        assert res['is_ready_to_submit'] is False
        assert 0 < res['readiness_percentage'] < 100
        assert res['status'] == 'incomplete'
        assert len(res['missing_required_documents']) >= 1

    def test_readiness_all_mandatory_documents_complete(self):
        res = calculate_application_readiness(
            scheme_id='standup-india',
            provided_documents=[
                'Aadhaar Card',
                'Caste Certificate',
                'Proof of Business Address',
                'Bank Account Statement',
                'Detailed Project Report (DPR)',
            ],
            uploaded_requirements=[
                'req-aadhaar',
                'req-caste',
                'req-address',
                'req-bank',
                'req-dpr',
            ],
        )
        assert res['is_ready_to_submit'] is True
        assert res['readiness_percentage'] == 100.0
        assert res['status'] == 'ready'
        assert len(res['missing_required_documents']) == 0
        assert 'All mandatory documents are format-validated' in res['next_action']

    def test_optional_documents_do_not_block_readiness(self):
        res = calculate_application_readiness(
            scheme_id='standup-india',
            provided_documents=[
                'Aadhaar Card',
                'Caste Certificate',
                'Proof of Business Address',
                'Bank Account Statement',
                'Detailed Project Report (DPR)',
            ],
            uploaded_requirements=[
                'req-aadhaar',
                'req-caste',
                'req-address',
                'req-bank',
                'req-dpr',
            ],
        )
        assert res['is_ready_to_submit'] is True
        assert res['readiness_percentage'] == 100.0
        assert res['status'] == 'ready'
        assert isinstance(res['missing_optional_documents'], list)


    def test_fastapi_readiness_endpoint(self):
        payload = {
            'scheme_id': 'standup-india',
            'provided_documents': ['Aadhaar Card'],
            'uploaded_requirements': ['req_aadhaar'],
        }
        response = client.post('/api/documents/readiness', json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['scheme_id'] == 'standup-india'
        assert 'readiness_percentage' in data
        assert 'missing_required_documents' in data
        assert 'is_ready_to_submit' in data


class TestDocumentStatusAndDownload:

    def test_get_application_documents_status(self):
        app_id = 'APP-2026-STATUS_TEST'
        save_uploaded_document(
            file_bytes=VALID_PDF_BYTES,
            filename='my_pan.pdf',
            requirement_id='req_pan',
            document_name='PAN Card',
            application_id=app_id,
            scheme_id='pmegp',
        )

        res = get_application_documents(app_id, scheme_id='pmegp')
        assert res['application_id'] == app_id
        assert len(res['documents']) >= 1
        assert res['documents'][0]['document_name'] == 'PAN Card'
        assert 'readiness' in res

    def test_fastapi_status_endpoint(self):
        app_id = 'APP-2026-API_STATUS_TEST'
        save_uploaded_document(
            file_bytes=VALID_PDF_BYTES,
            filename='aadhaar.pdf',
            requirement_id='req_aadhaar',
            document_name='Aadhaar Card',
            application_id=app_id,
            scheme_id='standup-india',
        )

        response = client.get(f'/api/documents/status/{app_id}?scheme_id=standup-india')
        assert response.status_code == 200
        data = response.json()
        assert data['application_id'] == app_id
        assert len(data['documents']) >= 1

    def test_fastapi_download_endpoint(self):
        doc = save_uploaded_document(
            file_bytes=VALID_PDF_BYTES,
            filename='dl_test.pdf',
            requirement_id='req_test_dl',
        )
        doc_id = doc['id']

        response = client.get(f'/api/documents/download/{doc_id}')
        assert response.status_code == 200
        assert response.content == VALID_PDF_BYTES
        assert response.headers['content-type'] == 'application/pdf'

    def test_download_nonexistent_document_404(self):
        response = client.get('/api/documents/download/DOC-NONEXISTENT-9999')
        assert response.status_code == 404


class TestBackwardCompatibility:

    def test_legacy_check_document_readiness(self):
        res = check_document_readiness(
            scheme_id='standup-india',
            provided_documents=['Aadhaar Card'],
        )
        assert 'readiness_percentage' in res
        assert 'required_documents' in res
        assert 'missing_documents' in res
        assert 'is_ready_to_submit' in res

    def test_legacy_get_scheme_required_documents(self):
        docs = get_scheme_required_documents('standup-india')
        assert isinstance(docs, list)
        assert len(docs) > 0
