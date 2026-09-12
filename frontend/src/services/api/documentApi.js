import { apiClient } from './client.js';

export async function getSchemeDocumentChecklist(schemeId = '') {
  const endpoint = schemeId ? `/api/documents/checklist/${encodeURIComponent(schemeId)}` : '/api/documents/checklist';
  return apiClient.get(endpoint);
}

export async function uploadSchemeDocument({
  file,
  requirementId,
  documentName = '',
  documentType = 'general',
  applicationId = '',
  schemeId = '',
}) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  if (!requirementId) {
    throw new Error('Requirement ID is required for document upload.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('requirement_id', requirementId);
  if (documentName) formData.append('document_name', documentName);
  if (documentType) formData.append('document_type', documentType);
  if (applicationId) formData.append('application_id', applicationId);
  if (schemeId) formData.append('scheme_id', schemeId);

  return apiClient.post('/api/documents/upload', formData);
}

export async function calculateDocumentReadiness({
  scheme_id,
  provided_documents = [],
  uploaded_requirements = [],
  application_id = '',
}) {
  return apiClient.post('/api/documents/readiness', {
    scheme_id,
    provided_documents,
    uploaded_requirements,
    application_id,
  });
}

export async function getApplicationDocumentStatus(applicationId, schemeId = '') {
  if (!applicationId) {
    throw new Error('Application ID is required.');
  }
  const query = schemeId ? `?scheme_id=${encodeURIComponent(schemeId)}` : '';
  return apiClient.get(`/api/documents/status/${encodeURIComponent(applicationId)}${query}`);
}

export async function deleteUploadedDocument(documentId, applicationId = '') {
  if (!documentId) {
    throw new Error('Document ID is required.');
  }
  const query = applicationId ? `?application_id=${encodeURIComponent(applicationId)}` : '';
  return apiClient.delete(`/api/documents/${encodeURIComponent(documentId)}${query}`);
}

export async function uploadApplicationDocument(applicationId, {
  file,
  requirementId,
  documentName = '',
  documentType = 'general',
  schemeId = '',
}) {
  if (!applicationId) {
    throw new Error('Application ID is required.');
  }
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  const formData = new FormData();
  formData.append('file', file);
  if (requirementId) formData.append('requirement_id', requirementId);
  if (documentName) formData.append('document_name', documentName);
  if (documentType) formData.append('document_type', documentType);
  if (schemeId) formData.append('scheme_id', schemeId);

  return apiClient.post(`/api/applications/${encodeURIComponent(applicationId)}/documents`, formData);
}

export async function getApplicationDocuments(applicationId, schemeId = '') {
  if (!applicationId) {
    throw new Error('Application ID is required.');
  }
  const query = schemeId ? `?scheme_id=${encodeURIComponent(schemeId)}` : '';
  return apiClient.get(`/api/applications/${encodeURIComponent(applicationId)}/documents${query}`);
}

export async function deleteApplicationDocument(applicationId, documentId) {
  if (!applicationId || !documentId) {
    throw new Error('Application ID and Document ID are required.');
  }
  return apiClient.delete(`/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`);
}

export async function getApplicationDocumentReadiness(applicationId, schemeId = '') {
  if (!applicationId) {
    throw new Error('Application ID is required.');
  }
  const query = schemeId ? `?scheme_id=${encodeURIComponent(schemeId)}` : '';
  return apiClient.get(`/api/applications/${encodeURIComponent(applicationId)}/document-readiness${query}`);
}

export function getDocumentDownloadUrl(documentId) {
  return `/api/documents/download/${encodeURIComponent(documentId)}`;
}


