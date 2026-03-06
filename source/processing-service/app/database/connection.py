"""
connection.py — Async SQLAlchemy engine and session factory.

Creates the database engine and provides a dependency-injectable
async session for use in FastAPI route handlers.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app import config

logger = logging.getLogger("processing-service.db")

# Create the async engine (connection pool)
engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,      # Set to True for SQL query logging during development
    pool_size=5,
    max_overflow=10,
)

# Session factory — produces AsyncSession instances
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """
    FastAPI dependency that yields an async database session.
    Automatically commits on success and rolls back on error.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """
    Create all database tables on startup.
    Called from the FastAPI lifespan handler.
    """
    from app.database.models import Base  # Import here to avoid circular imports
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")
