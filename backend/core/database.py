from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from core.config import settings


class Base(DeclarativeBase):
    pass


# Detect Supabase Transaction Pooler (port 6543) — requires prepared statements disabled
_db_url = settings.database_url
_is_supabase_transaction_pooler = (
    "pooler.supabase.com" in _db_url and ":6543/" in _db_url
)

_connect_args = {}
if _is_supabase_transaction_pooler:
    # asyncpg prepared statements are not supported in Supabase transaction pool mode
    _connect_args = {"statement_cache_size": 0}

engine = create_async_engine(
    _db_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            if session.is_active:
                await session.commit()
        except Exception:
            if session.is_active:
                await session.rollback()
            raise


async def init_db():
    """Create all tables. Run once at startup."""
    # Import models so SQLAlchemy registers them
    from models import scheme, user_profile, application  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
