"""
Admin Router for Scheme_Saathi
Handles administrative authentication, metrics, scheme & provenance management,
document requirements, partner directory, application review & status transitions,
and immutable audit logging.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_admin, verify_admin_credentials, issue_admin_token
from schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminProfileResponse,
    AdminMetricsResponse,
    AdminSchemeListResponse,
    AdminSchemeUpdateRequest,
    AdminDocRequirementUpdate,
    AdminPartnerListResponse,
    AdminApplicationListResponse,
    AdminApplicationDetailResponse,
    AdminStatusTransitionRequest,
    AdminStatusTransitionResponse,
    AdminAuditLogsResponse,
)
from services import admin_service

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


@router.post("/auth/login", response_model=AdminLoginResponse, summary="Admin Login")
async def admin_login(
    payload: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    identifier = payload.email or payload.username
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is required.",
        )

    admin_info = verify_admin_credentials(identifier, payload.password)
    if not admin_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative credentials. Access restricted to authorized personnel.",
        )
    
    token = issue_admin_token(admin_info["email"], admin_info["role"], admin_info["name"])
    
    await admin_service.log_audit_event(
        db=db,
        action="ADMIN_LOGIN",
        actor_email=admin_info["email"],
        actor_role=admin_info["role"],
        entity_type="AUTH",
        entity_id=admin_info["email"],
        details={"status": "success", "role": admin_info["role"]},
    )
    
    return AdminLoginResponse(
        token=token,
        access_token=token,
        email=admin_info["email"],
        username=admin_info["email"],
        role=admin_info["role"],
        name=admin_info["name"],
        expires_in_hours=24,
    )


@router.get("/auth/me", response_model=AdminProfileResponse, summary="Verify Admin Session")
async def admin_me(
    current_admin: dict = Depends(get_current_admin),
):
    return AdminProfileResponse(
        email=current_admin["email"],
        username=current_admin["email"],
        role=current_admin["role"],
        name=current_admin["name"],
    )


@router.get("/metrics", response_model=AdminMetricsResponse, summary="Admin Dashboard Operational Metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    metrics = await admin_service.get_operational_metrics(db)
    return metrics


@router.get("/schemes", response_model=AdminSchemeListResponse, summary="List Schemes for Admin")
async def list_schemes(
    search: Optional[str] = Query(None, description="Search by name or ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    active_only: bool = Query(False, description="Filter active only"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    result = await admin_service.list_admin_schemes(
        db=db,
        search=search,
        category=category,
        active_only=active_only,
        skip=skip,
        limit=limit,
    )
    return result


@router.put("/schemes/{scheme_id}", summary="Update Scheme")
async def update_scheme(
    scheme_id: str,
    payload: AdminSchemeUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    updated = await admin_service.update_scheme_record(
        db=db,
        scheme_id=scheme_id,
        update_data=payload.dict(exclude_unset=True),
        actor=current_admin,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with ID '{scheme_id}' not found.",
        )
    return updated


@router.get("/schemes/{scheme_id}/requirements", summary="Get Scheme Document Requirements")
async def get_scheme_requirements(
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    reqs = await admin_service.get_scheme_document_requirements(db, scheme_id)
    if reqs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with ID '{scheme_id}' not found.",
        )
    return reqs


@router.put("/schemes/{scheme_id}/requirements", summary="Update Scheme Document Requirements")
async def update_scheme_requirements(
    scheme_id: str,
    payload: AdminDocRequirementUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    updated = await admin_service.update_scheme_document_requirements(
        db=db,
        scheme_id=scheme_id,
        requirements_payload=payload.dict(),
        actor=current_admin,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with ID '{scheme_id}' not found.",
        )
    return updated


@router.get("/partners", response_model=AdminPartnerListResponse, summary="List Channel Partners")
async def list_partners(
    state: Optional[str] = Query(None, description="Filter by state"),
    partner_type: Optional[str] = Query(None, description="Filter by partner type"),
    active_only: bool = Query(False, description="Filter active only"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    result = await admin_service.list_admin_partners(
        db=db,
        state=state,
        partner_type=partner_type,
        active_only=active_only,
        skip=skip,
        limit=limit,
    )
    return result


@router.get("/applications", response_model=AdminApplicationListResponse, summary="List Beneficiary Applications")
async def list_applications(
    status: Optional[str] = Query(None, description="Filter by application status"),
    scheme_id: Optional[str] = Query(None, description="Filter by scheme ID"),
    partner_id: Optional[str] = Query(None, description="Filter by partner ID"),
    search: Optional[str] = Query(None, description="Search by application ID or applicant name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    result = await admin_service.list_admin_applications(
        db=db,
        status=status,
        scheme_id=scheme_id,
        partner_id=partner_id,
        search=search,
        skip=skip,
        limit=limit,
    )
    return result


@router.get("/applications/{application_id}", response_model=AdminApplicationDetailResponse, summary="Get Application Details")
async def get_application_detail(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    app = await admin_service.get_admin_application_detail(db, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found.",
        )
    return app


@router.post("/applications/{application_id}/transition", response_model=AdminStatusTransitionResponse, summary="Transition Application Status")
async def transition_application_status(
    application_id: str,
    payload: AdminStatusTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    result = await admin_service.transition_application_status(
        db=db,
        application_id=application_id,
        to_status=payload.to_status or payload.new_status,
        remarks=payload.remarks or payload.note,
        sanctioned_amount=payload.sanctioned_amount,
        rejection_reason=payload.rejection_reason,
        actor=current_admin,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to transition application status."),
        )
    return result


@router.get("/audit-logs", response_model=AdminAuditLogsResponse, summary="Audit Logs")
async def get_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity type (SCHEME, APPLICATION, REQUIREMENT, AUTH)"),
    entity_id: Optional[str] = Query(None, description="Filter by specific entity ID"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    logs = await admin_service.get_audit_logs(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        skip=skip,
        limit=limit,
    )
    return logs
