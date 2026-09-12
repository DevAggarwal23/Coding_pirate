from sqlalchemy import String, Integer, Boolean, DateTime, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from core.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    scheme_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    scheme_name: Mapped[str] = mapped_column(Text, nullable=False)
    ministry: Mapped[str | None] = mapped_column(Text)
    categories: Mapped[list[str]] = mapped_column(ARRAY(Text), default=[])
    max_income: Mapped[int | None] = mapped_column(Integer)
    eligible_states: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    business_types: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    benefit_amount: Mapped[str | None] = mapped_column(Text)
    documents_req: Mapped[list[str]] = mapped_column(ARRAY(Text), default=[])
    application_url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(Text, default="myscheme.gov.in")
    source_url: Mapped[str | None] = mapped_column(Text)
    eligibility_text: Mapped[str | None] = mapped_column(Text)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(50), default="active")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def to_dict(self) -> dict:
        return {
            "scheme_id": self.scheme_id,
            "scheme_name": self.scheme_name,
            "ministry": self.ministry,
            "categories": self.categories or [],
            "max_income": self.max_income,
            "eligible_states": self.eligible_states,
            "business_types": self.business_types,
            "benefit_amount": self.benefit_amount,
            "documents_req": self.documents_req or [],
            "application_url": self.application_url,
            "source": self.source or "myscheme.gov.in",
            "source_url": self.source_url or self.application_url,
            "eligibility_text": self.eligibility_text,
            "last_verified": self.last_verified.isoformat() if self.last_verified else None,
            "status": self.status or ("active" if self.is_active else "inactive"),
            "is_active": self.is_active,
        }
