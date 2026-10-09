import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, status

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        )
    return secret


def get_login_credentials(role: str) -> tuple[str, str]:
    prefix = "ADMIN" if role == "admin" else "VERIFIER"
    username = os.getenv(f"{prefix}_USERNAME")
    password = os.getenv(f"{prefix}_PASSWORD")
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{role.capitalize()} login is not configured",
        )
    return username, password
