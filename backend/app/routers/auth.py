from datetime import UTC, datetime, timedelta
from hmac import compare_digest

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt

from app.auth_config import get_jwt_secret, get_login_credentials
from app.dependencies import JWT_ALGORITHM, UserRole
from app.rate_limit import RateLimit
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(tags=["authentication"])
TOKEN_LIFETIME = timedelta(hours=1)
admin_login_rate_limit = RateLimit(max_requests=60, window_seconds=60)
verifier_login_rate_limit = RateLimit(max_requests=60, window_seconds=60)


def _login(payload: LoginRequest, role: UserRole) -> LoginResponse:
    expected_username, expected_password = get_login_credentials(role)
    valid_username = compare_digest(payload.username.encode(), expected_username.encode())
    valid_password = compare_digest(payload.password.encode(), expected_password.encode())
    if not (valid_username and valid_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    now = datetime.now(UTC)
    expires_at = now + TOKEN_LIFETIME
    token = jwt.encode(
        {"sub": expected_username, "role": role, "iat": now, "exp": expires_at},
        get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )
    return LoginResponse(access_token=token, role=role, expires_at=expires_at)


@router.post(
    "/admin/login",
    response_model=LoginResponse,
    dependencies=[Depends(admin_login_rate_limit)],
)
def admin_login(payload: LoginRequest) -> LoginResponse:
    return _login(payload, "admin")


@router.post(
    "/verifier/login",
    response_model=LoginResponse,
    dependencies=[Depends(verifier_login_rate_limit)],
)
def verifier_login(payload: LoginRequest) -> LoginResponse:
    return _login(payload, "verifier")
