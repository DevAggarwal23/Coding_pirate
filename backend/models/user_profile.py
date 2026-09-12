import uuid
from sqlalchemy import String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone_hash: Mapped[str | None] = mapped_column(Text, unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(50))
    income: Mapped[int | None] = mapped_column(Integer)
    state: Mapped[str | None] = mapped_column(String(100))
    business_type: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
