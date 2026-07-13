import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Fetch the URL cleanly from environment variables
DATABASE_URL = os.getenv("PRODUCTION_DB_URI")

# 2. Add a safeguard so the application doesn't run with an empty configuration
if not DATABASE_URL:
    print("CRITICAL ERROR: DATABASE_URL environment variable is not set.", file=sys.stderr)
    print("Please set it in your local .env file or environment shell.", file=sys.stderr)
    sys.exit(1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()