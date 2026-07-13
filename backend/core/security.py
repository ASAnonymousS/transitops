from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import hashlib
from backend.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Hash the incoming plain password and compare it to the stored hash
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    # Using hashlib SHA-256 creates a stable, zero-dependency hash string
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None