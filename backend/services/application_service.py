"""
Application Management and Status Lifecycle Service.
Provides draft application creation, document readiness integration,
controlled status lifecycle transitions, and status history timeline tracking.
"""
import uuid
import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc

from models.application import Application
from models.status_history import ApplicationStatusHistory
from models.user_profile import UserProfile
from schemas.application import (
    STATUS_LABELS,
    STATUS_MESSAGES,
    StatusHistoryItem,
    ApplicationCreateRequest,
    ApplicationSubmitRequest,
    ApplicationStatusTransitionRequest,
    ApplicationStatusResponse,
    ApplicationDetailResponse,
    ApplicationHistoryResponse,
    ApplicationListResponse,
)
from services.document_service import calculate_application_readiness

logger = logging.getLogger(__name__)

# In-memory storage cache fallbacks for database independence / testing
_IN_MEMORY_APPLICATIONS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_STATUS_HISTORY: Dict[str, List[Dict[str, Any]]] = {}

# Estimated processing times by scheme name / keyword
PROCESSING_TIMES = {
    "Stand-Up India": "15-30 working days",
    "PM-DAKSH": "7-14 working days",
    "PMEGP": "30-45 working days",
    "default": "15-30 working days",
}

# Next steps recommendations by status
NEXT_STEPS = {
    "draft": "Upload required documents to complete application readiness.",
    "documents_pending": "Upload remaining mandatory documents for your selected scheme.",
    "ready_for_submission": "All documents are ready. Click Submit to forward to your selected Channel Partner.",
    "submitted": "Application submitted. Channel Partner nodal officer will initiate document review.",
    "under_review": "Nodal officer is verifying your identity and project details. You may receive a verification call.",
    "action_required": "Additional document or clarification requested by Channel Partner. Please review and re-upload.",
    "approved": "Application approved by Nodal Authority. Visit the branch with originals for disbursement scheduling.",
    "rejected": "Application not approved in this cycle. Please contact the district helpdesk or re-apply.",
    "disbursed": "Loan / subsidy amount disbursed to designated account.",
}

# DB Timeout threshold in seconds
DB_TIMEOUT_SEC = 0.5


def _get_now_iso() -> str:
    return datetime.utcnow().isoformat()


def _get_processing_time(scheme_name: Optional[str]) -> str:
    if not scheme_name:
        return PROCESSING_TIMES["default"]
    for key, val in PROCESSING_TIMES.items():
        if key.lower() in scheme_name.lower():
            return val
    return PROCESSING_TIMES["default"]


async def create_application(
    request: ApplicationCreateRequest,
    db: Optional[AsyncSession] = None,
) -> ApplicationDetailResponse:
    """
    Creates a new draft application and initializes status history.
    """
    app_id = Application.generate_id()
    now_iso = _get_now_iso()
    now_dt = datetime.utcnow()

    # Determine initial status based on document checklist
    readiness = calculate_application_readiness(scheme_id=request.scheme_id)
    if readiness.get("required_documents", 0) > 0 and not readiness.get("is_ready_to_submit", False):
        initial_status = "documents_pending"
    else:
        initial_status = "draft"

    initial_note = request.notes or f"Application created in {initial_status} status."

    # In-memory record
    app_record = {
        "application_id": app_id,
        "user_id": request.user_id,
        "scheme_id": request.scheme_id,
        "scheme_name": request.scheme_name or request.scheme_id,
        "partner_id": request.partner_id,
        "partner_name": request.partner_name,
        "status": initial_status,
        "notes": request.notes,
        "category": request.category,
        "income": request.income,
        "state": request.state,
        "business_type": request.business_type,
        "project_cost": request.project_cost,
        "phone_hash": request.phone_hash,
        "created_at": now_iso,
        "submitted_at": None,
        "last_updated": now_iso,
    }
    _IN_MEMORY_APPLICATIONS[app_id] = app_record

    # Initial history item
    history_item = {
        "id": str(uuid.uuid4()),
        "application_id": app_id,
        "old_status": None,
        "new_status": initial_status,
        "status_label": STATUS_LABELS.get(initial_status, initial_status),
        "changed_by": "applicant",
        "note": initial_note,
        "created_at": now_iso,
    }
    _IN_MEMORY_STATUS_HISTORY[app_id] = [history_item]

    # Database persistence if active
    if db is not None:
        async def _save_to_db():
            profile_id = uuid.uuid4()
            profile = UserProfile(
                profile_id=profile_id,
                phone_hash=request.phone_hash,
                category=request.category,
                income=request.income,
                state=request.state,
                business_type=request.business_type,
            )
            db.add(profile)
            await db.flush()

            app = Application(
                application_id=app_id,
                profile_id=profile_id,
                scheme_id=request.scheme_id,
                partner_id=request.partner_id,
                status=initial_status,
                notes=request.notes,
                created_at=now_dt,
                last_updated=now_dt,
            )
            db.add(app)
            await db.flush()

            history = ApplicationStatusHistory(
                application_id=app_id,
                old_status=None,
                new_status=initial_status,
                changed_by="applicant",
                note=initial_note,
                created_at=now_dt,
            )
            db.add(history)
            await db.commit()

        try:
            await asyncio.wait_for(_save_to_db(), timeout=DB_TIMEOUT_SEC)
            logger.info(f"Application {app_id} and initial status history saved to database.")
        except Exception as e:
            logger.debug(f"Database save bypassed or unavailable ({e}); utilizing in-memory persistence.")
            try:
                await db.rollback()
            except Exception:
                pass

    return ApplicationDetailResponse(
        application_id=app_id,
        user_id=request.user_id,
        scheme_id=request.scheme_id,
        scheme_name=request.scheme_name,
        partner_id=request.partner_id,
        partner_name=request.partner_name,
        status=initial_status,
        status_label=STATUS_LABELS.get(initial_status, initial_status),
        notes=request.notes,
        created_at=now_iso,
        submitted_at=None,
        last_updated=now_iso,
        document_readiness=readiness,
        timeline=[StatusHistoryItem(**history_item)],
    )


async def submit_application(
    application_id: Optional[str] = None,
    request: Optional[ApplicationSubmitRequest] = None,
    db: Optional[AsyncSession] = None,
) -> ApplicationStatusResponse:
    """
    Submits an application to the selected Channel Partner.
    Transitions status to 'submitted', records timestamp and history.
    """
    now_iso = _get_now_iso()
    now_dt = datetime.utcnow()

    # If application_id is provided, look it up
    existing_app = None
    if application_id and application_id in _IN_MEMORY_APPLICATIONS:
        existing_app = _IN_MEMORY_APPLICATIONS[application_id]

    if not existing_app and application_id and db is not None:
        async def _fetch_from_db():
            res = await db.execute(select(Application).where(Application.application_id == application_id))
            return res.scalar_one_or_none()

        try:
            db_app = await asyncio.wait_for(_fetch_from_db(), timeout=DB_TIMEOUT_SEC)
            if db_app:
                existing_app = {
                    "application_id": db_app.application_id,
                    "scheme_id": db_app.scheme_id,
                    "scheme_name": db_app.scheme_id,
                    "partner_id": db_app.partner_id,
                    "partner_name": None,
                    "status": db_app.status,
                    "notes": db_app.notes,
                    "created_at": db_app.created_at.isoformat() if hasattr(db_app.created_at, "isoformat") else str(db_app.created_at),
                    "submitted_at": db_app.submitted_at.isoformat() if db_app.submitted_at else None,
                    "last_updated": db_app.last_updated.isoformat() if hasattr(db_app.last_updated, "isoformat") else str(db_app.last_updated),
                }
                _IN_MEMORY_APPLICATIONS[application_id] = existing_app
        except Exception as e:
            logger.debug(f"Failed to fetch application {application_id} from DB: {e}")

    # If application doesn't exist yet, create one on the fly (for legacy submit endpoint)
    if not existing_app:
        app_id = application_id or Application.generate_id()
        scheme_id = (request.scheme_id if request else None) or "standup-india"
        scheme_name = (request.scheme_name if request else None) or scheme_id
        partner_id = request.partner_id if request else None
        partner_name = request.partner_name if request else None
        notes = request.notes if request else None

        existing_app = {
            "application_id": app_id,
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "partner_id": partner_id,
            "partner_name": partner_name,
            "status": "draft",
            "notes": notes,
            "created_at": now_iso,
            "submitted_at": None,
            "last_updated": now_iso,
        }
        _IN_MEMORY_APPLICATIONS[app_id] = existing_app
        _IN_MEMORY_STATUS_HISTORY[app_id] = [{
            "id": str(uuid.uuid4()),
            "application_id": app_id,
            "old_status": None,
            "new_status": "draft",
            "status_label": STATUS_LABELS.get("draft", "draft"),
            "changed_by": "applicant",
            "note": "Application created.",
            "created_at": now_iso,
        }]

    app_id = existing_app["application_id"]
    old_status = existing_app.get("status", "draft")

    # If partner or notes updated in submit request
    if request:
        if request.partner_id:
            existing_app["partner_id"] = request.partner_id
        if request.partner_name:
            existing_app["partner_name"] = request.partner_name
        if request.notes:
            existing_app["notes"] = request.notes

    # Update status to submitted
    new_status = "submitted"
    existing_app["status"] = new_status
    existing_app["submitted_at"] = now_iso
    existing_app["last_updated"] = now_iso

    submit_note = (request.notes if request and request.notes else None) or "Application submitted to Channel Partner."

    history_item = {
        "id": str(uuid.uuid4()),
        "application_id": app_id,
        "old_status": old_status,
        "new_status": new_status,
        "status_label": STATUS_LABELS.get(new_status, new_status),
        "changed_by": "applicant",
        "note": submit_note,
        "created_at": now_iso,
    }

    if app_id not in _IN_MEMORY_STATUS_HISTORY:
        _IN_MEMORY_STATUS_HISTORY[app_id] = []
    _IN_MEMORY_STATUS_HISTORY[app_id].append(history_item)

    # Database update
    if db is not None:
        async def _save_submit_db():
            res = await db.execute(select(Application).where(Application.application_id == app_id))
            db_app = res.scalar_one_or_none()

            if db_app:
                db_app.status = new_status
                db_app.submitted_at = now_dt
                db_app.last_updated = now_dt
                if request and request.partner_id:
                    db_app.partner_id = request.partner_id
                if request and request.notes:
                    db_app.notes = request.notes
            else:
                profile = UserProfile(
                    profile_id=uuid.uuid4(),
                    phone_hash=request.phone_hash if request else None,
                    category=request.category if request else None,
                    income=request.income if request else None,
                    state=request.state if request else None,
                    business_type=request.business_type if request else None,
                )
                db.add(profile)
                await db.flush()

                db_app = Application(
                    application_id=app_id,
                    profile_id=profile.profile_id,
                    scheme_id=existing_app["scheme_id"],
                    partner_id=existing_app.get("partner_id"),
                    status=new_status,
                    notes=existing_app.get("notes"),
                    created_at=now_dt,
                    submitted_at=now_dt,
                    last_updated=now_dt,
                )
                db.add(db_app)
                await db.flush()

            history_row = ApplicationStatusHistory(
                application_id=app_id,
                old_status=old_status,
                new_status=new_status,
                changed_by="applicant",
                note=submit_note,
                created_at=now_dt,
            )
            db.add(history_row)
            await db.commit()

        try:
            await asyncio.wait_for(_save_submit_db(), timeout=DB_TIMEOUT_SEC)
            logger.info(f"Application {app_id} submission committed to database.")
        except Exception as e:
            logger.debug(f"Database submission commit bypassed ({e}); relying on in-memory.")
            try:
                await db.rollback()
            except Exception:
                pass

    timeline_items = [StatusHistoryItem(**item) for item in _IN_MEMORY_STATUS_HISTORY.get(app_id, [])]
    processing_time = _get_processing_time(existing_app.get("scheme_name"))

    return ApplicationStatusResponse(
        application_id=app_id,
        scheme_id=existing_app.get("scheme_id"),
        scheme_name=existing_app.get("scheme_name"),
        partner_id=existing_app.get("partner_id"),
        partner_name=existing_app.get("partner_name"),
        status=new_status,
        status_label=STATUS_LABELS.get(new_status, new_status),
        message=STATUS_MESSAGES.get(new_status, ""),
        next_step=NEXT_STEPS.get(new_status, NEXT_STEPS["submitted"]),
        created_at=existing_app.get("created_at"),
        submitted_at=existing_app.get("submitted_at"),
        last_updated=now_iso,
        estimated_processing=processing_time,
        timeline=timeline_items,
    )


async def transition_application_status(
    application_id: str,
    request: ApplicationStatusTransitionRequest,
    db: Optional[AsyncSession] = None,
) -> ApplicationStatusResponse:
    """
    Transitions application status with validation and authorization rules.
    - Applicants CANNOT approve, disburse, or reject applications.
    - Validates target status is in the valid status domain.
    - Appends status transition to immutable history.
    """
    new_status = request.new_status.strip().lower()
    changed_by = (request.changed_by or "applicant").strip().lower()

    if new_status not in STATUS_LABELS:
        raise ValueError(f"Invalid status '{new_status}'. Allowed statuses: {list(STATUS_LABELS.keys())}")

    # Authorization Check: Applicants cannot self-approve, reject, or disburse
    if changed_by == "applicant" and new_status in ["approved", "disbursed", "rejected", "under_review"]:
        raise PermissionError(
            f"Applicants are not authorized to transition status to '{new_status}'. Authorized nodal partner action required."
        )

    # Fetch existing application
    app_record = _IN_MEMORY_APPLICATIONS.get(application_id)

    if not app_record and db is not None:
        async def _fetch_app():
            res = await db.execute(select(Application).where(Application.application_id == application_id))
            return res.scalar_one_or_none()
        try:
            db_app = await asyncio.wait_for(_fetch_app(), timeout=DB_TIMEOUT_SEC)
            if db_app:
                app_record = {
                    "application_id": db_app.application_id,
                    "scheme_id": db_app.scheme_id,
                    "scheme_name": db_app.scheme_id,
                    "partner_id": db_app.partner_id,
                    "partner_name": None,
                    "status": db_app.status,
                    "notes": db_app.notes,
                    "created_at": db_app.created_at.isoformat() if hasattr(db_app.created_at, "isoformat") else str(db_app.created_at),
                    "submitted_at": db_app.submitted_at.isoformat() if db_app.submitted_at else None,
                    "last_updated": db_app.last_updated.isoformat() if hasattr(db_app.last_updated, "isoformat") else str(db_app.last_updated),
                }
                _IN_MEMORY_APPLICATIONS[application_id] = app_record
        except Exception as e:
            logger.debug(f"Error checking app in DB: {e}")

    if not app_record:
        raise KeyError(f"Application {application_id} not found.")

    old_status = app_record.get("status", "draft")
    now_iso = _get_now_iso()
    now_dt = datetime.utcnow()

    # Update in-memory record
    app_record["status"] = new_status
    app_record["last_updated"] = now_iso
    if new_status == "submitted" and not app_record.get("submitted_at"):
        app_record["submitted_at"] = now_iso

    # Append to history
    transition_note = request.note or f"Status transitioned from {old_status} to {new_status} by {changed_by}."
    history_item = {
        "id": str(uuid.uuid4()),
        "application_id": application_id,
        "old_status": old_status,
        "new_status": new_status,
        "status_label": STATUS_LABELS.get(new_status, new_status),
        "changed_by": changed_by,
        "note": transition_note,
        "created_at": now_iso,
    }

    if application_id not in _IN_MEMORY_STATUS_HISTORY:
        _IN_MEMORY_STATUS_HISTORY[application_id] = []
    _IN_MEMORY_STATUS_HISTORY[application_id].append(history_item)

    # Persist in DB
    if db is not None:
        async def _save_transition_db():
            res = await db.execute(select(Application).where(Application.application_id == application_id))
            db_app = res.scalar_one_or_none()
            if db_app:
                db_app.status = new_status
                db_app.last_updated = now_dt
                if new_status == "submitted" and not db_app.submitted_at:
                    db_app.submitted_at = now_dt

                history_row = ApplicationStatusHistory(
                    application_id=application_id,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=changed_by,
                    note=transition_note,
                    created_at=now_dt,
                )
                db.add(history_row)
                await db.commit()

        try:
            await asyncio.wait_for(_save_transition_db(), timeout=DB_TIMEOUT_SEC)
            logger.info(f"Status transition for {application_id} saved to database.")
        except Exception as e:
            logger.debug(f"Database transition save bypassed ({e}); in-memory state updated.")
            try:
                await db.rollback()
            except Exception:
                pass

    timeline_items = [StatusHistoryItem(**item) for item in _IN_MEMORY_STATUS_HISTORY.get(application_id, [])]
    processing_time = _get_processing_time(app_record.get("scheme_name"))

    return ApplicationStatusResponse(
        application_id=application_id,
        scheme_id=app_record.get("scheme_id"),
        scheme_name=app_record.get("scheme_name"),
        partner_id=app_record.get("partner_id"),
        partner_name=app_record.get("partner_name"),
        status=new_status,
        status_label=STATUS_LABELS.get(new_status, new_status),
        message=STATUS_MESSAGES.get(new_status, ""),
        next_step=NEXT_STEPS.get(new_status, "Check back for updates."),
        created_at=app_record.get("created_at"),
        submitted_at=app_record.get("submitted_at"),
        last_updated=now_iso,
        estimated_processing=processing_time,
        timeline=timeline_items,
    )


async def get_application_history(
    application_id: str,
    db: Optional[AsyncSession] = None,
) -> ApplicationHistoryResponse:
    """
    Retrieves the complete chronological status history timeline for an application.
    """
    history_items: List[StatusHistoryItem] = []
    current_status = "draft"

    # Try DB first
    if db is not None:
        async def _query_history_db():
            res = await db.execute(select(Application).where(Application.application_id == application_id))
            db_app = res.scalar_one_or_none()
            if not db_app:
                return None, []
            h_res = await db.execute(
                select(ApplicationStatusHistory)
                .where(ApplicationStatusHistory.application_id == application_id)
                .order_by(ApplicationStatusHistory.created_at.asc())
            )
            return db_app.status, h_res.scalars().all()

        try:
            c_stat, rows = await asyncio.wait_for(_query_history_db(), timeout=DB_TIMEOUT_SEC)
            if rows:
                current_status = c_stat
                history_items = [
                    StatusHistoryItem(
                        id=str(row.id),
                        application_id=row.application_id,
                        old_status=row.old_status,
                        new_status=row.new_status,
                        status_label=STATUS_LABELS.get(row.new_status, row.new_status),
                        changed_by=row.changed_by,
                        note=row.note,
                        created_at=row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
                    )
                    for row in rows
                ]
        except Exception as e:
            logger.debug(f"Database query for history bypassed: {e}")

    # Fallback to in-memory
    if not history_items and application_id in _IN_MEMORY_STATUS_HISTORY:
        mem_items = _IN_MEMORY_STATUS_HISTORY[application_id]
        history_items = [StatusHistoryItem(**item) for item in mem_items]
        if application_id in _IN_MEMORY_APPLICATIONS:
            current_status = _IN_MEMORY_APPLICATIONS[application_id].get("status", "draft")

    if not history_items and application_id not in _IN_MEMORY_APPLICATIONS:
        raise KeyError(f"Application {application_id} not found.")

    return ApplicationHistoryResponse(
        application_id=application_id,
        current_status=current_status,
        status_label=STATUS_LABELS.get(current_status, current_status),
        history=history_items,
    )


async def get_application_detail(
    application_id: str,
    db: Optional[AsyncSession] = None,
) -> ApplicationDetailResponse:
    """
    Retrieves full application details including scheme, partner, document readiness, and status timeline.
    """
    app_data = _IN_MEMORY_APPLICATIONS.get(application_id)

    if not app_data and db is not None:
        async def _fetch_detail_db():
            res = await db.execute(select(Application).where(Application.application_id == application_id))
            return res.scalar_one_or_none()

        try:
            db_app = await asyncio.wait_for(_fetch_detail_db(), timeout=DB_TIMEOUT_SEC)
            if db_app:
                app_data = {
                    "application_id": db_app.application_id,
                    "scheme_id": db_app.scheme_id,
                    "scheme_name": db_app.scheme_id,
                    "partner_id": db_app.partner_id,
                    "partner_name": None,
                    "status": db_app.status,
                    "notes": db_app.notes,
                    "created_at": db_app.created_at.isoformat() if hasattr(db_app.created_at, "isoformat") else str(db_app.created_at),
                    "submitted_at": db_app.submitted_at.isoformat() if db_app.submitted_at else None,
                    "last_updated": db_app.last_updated.isoformat() if hasattr(db_app.last_updated, "isoformat") else str(db_app.last_updated),
                }
                _IN_MEMORY_APPLICATIONS[application_id] = app_data
        except Exception as e:
            logger.debug(f"Error fetching app detail from DB: {e}")

    if not app_data:
        raise KeyError(f"Application {application_id} not found.")

    # Fetch history timeline
    try:
        hist_resp = await get_application_history(application_id, db=db)
        timeline = hist_resp.history
    except Exception:
        timeline = [StatusHistoryItem(**item) for item in _IN_MEMORY_STATUS_HISTORY.get(application_id, [])]

    # Calculate document readiness
    readiness = calculate_application_readiness(
        scheme_id=app_data.get("scheme_id"),
        application_id=application_id,
    )

    current_status = app_data.get("status", "draft")

    return ApplicationDetailResponse(
        application_id=application_id,
        user_id=str(app_data.get("user_id")) if app_data.get("user_id") else None,
        scheme_id=app_data.get("scheme_id", ""),
        scheme_name=app_data.get("scheme_name"),
        partner_id=app_data.get("partner_id"),
        partner_name=app_data.get("partner_name"),
        status=current_status,
        status_label=STATUS_LABELS.get(current_status, current_status),
        notes=app_data.get("notes"),
        created_at=app_data.get("created_at", _get_now_iso()),
        submitted_at=app_data.get("submitted_at"),
        last_updated=app_data.get("last_updated", _get_now_iso()),
        document_readiness=readiness,
        timeline=timeline,
    )


async def get_application_status_response(
    application_id: str,
    db: Optional[AsyncSession] = None,
) -> ApplicationStatusResponse:
    """
    Returns ApplicationStatusResponse with full timeline, labels, and next action recommendations.
    """
    detail = await get_application_detail(application_id, db=db)
    current_status = detail.status
    processing_time = _get_processing_time(detail.scheme_name)

    return ApplicationStatusResponse(
        application_id=detail.application_id,
        scheme_id=detail.scheme_id,
        scheme_name=detail.scheme_name,
        partner_id=detail.partner_id,
        partner_name=detail.partner_name,
        status=current_status,
        status_label=detail.status_label,
        message=STATUS_MESSAGES.get(current_status, ""),
        next_step=NEXT_STEPS.get(current_status, NEXT_STEPS["submitted"]),
        created_at=detail.created_at,
        submitted_at=detail.submitted_at,
        last_updated=detail.last_updated,
        estimated_processing=processing_time,
        timeline=detail.timeline,
    )


async def list_user_applications(
    user_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> ApplicationListResponse:
    """
    Lists all applications with summary and timeline details.
    """
    results: List[ApplicationDetailResponse] = []
    seen_ids = set()

    # DB records
    if db is not None:
        async def _query_all_apps():
            stmt = select(Application)
            if user_id:
                try:
                    stmt = stmt.where(Application.user_id == uuid.UUID(user_id))
                except Exception:
                    pass
            stmt = stmt.order_by(Application.created_at.desc())
            res = await db.execute(stmt)
            return res.scalars().all()

        try:
            db_apps = await asyncio.wait_for(_query_all_apps(), timeout=DB_TIMEOUT_SEC)
            for db_app in db_apps:
                seen_ids.add(db_app.application_id)
                detail = await get_application_detail(db_app.application_id, db=db)
                results.append(detail)
        except Exception as e:
            logger.debug(f"Error querying applications from DB: {e}")

    # In-memory records not in DB
    for app_id, app_info in _IN_MEMORY_APPLICATIONS.items():
        if app_id not in seen_ids:
            if user_id and app_info.get("user_id") and str(app_info.get("user_id")) != str(user_id):
                continue
            try:
                detail = await get_application_detail(app_id, db=db)
                results.append(detail)
                seen_ids.add(app_id)
            except Exception:
                pass

    return ApplicationListResponse(
        applications=results,
        total_count=len(results),
    )