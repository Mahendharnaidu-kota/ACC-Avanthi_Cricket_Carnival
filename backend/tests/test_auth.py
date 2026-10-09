import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_ADMIN_USERNAME = "test-admin"
TEST_ADMIN_PASSWORD = "admin-test-password"
TEST_VERIFIER_USERNAME = "test-verifier"
TEST_VERIFIER_PASSWORD = "verifier-test-password"
TEST_JWT_SECRET = "test-only-secret-that-is-long-enough-for-hs256"


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_USERNAME", TEST_ADMIN_USERNAME)
    monkeypatch.setenv("ADMIN_PASSWORD", TEST_ADMIN_PASSWORD)
    monkeypatch.setenv("VERIFIER_USERNAME", TEST_VERIFIER_USERNAME)
    monkeypatch.setenv("VERIFIER_PASSWORD", TEST_VERIFIER_PASSWORD)
    monkeypatch.setenv("JWT_SECRET", TEST_JWT_SECRET)

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def login(client: TestClient, role: str) -> str:
    username = TEST_ADMIN_USERNAME if role == "admin" else TEST_VERIFIER_USERNAME
    password = TEST_ADMIN_PASSWORD if role == "admin" else TEST_VERIFIER_PASSWORD
    response = client.post(f"/api/{role}/login", json={"username": username, "password": password})
    assert response.status_code == 200
    assert response.json()["role"] == role
    return response.json()["access_token"]


@pytest.mark.parametrize("role", ["admin", "verifier"])
def test_wrong_password_is_rejected(client: TestClient, role: str) -> None:
    username = TEST_ADMIN_USERNAME if role == "admin" else TEST_VERIFIER_USERNAME
    response = client.post(
        f"/api/{role}/login",
        json={"username": username, "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


@pytest.mark.parametrize("role", ["admin", "verifier"])
def test_login_returns_signed_role_token_with_expiry(client: TestClient, role: str) -> None:
    token = login(client, role)
    claims = jwt.decode(token, TEST_JWT_SECRET, algorithms=["HS256"])
    assert claims["role"] == role
    assert claims["exp"] > claims["iat"]


def test_no_token_returns_401_for_protected_endpoints(client: TestClient) -> None:
    team_payload = {
        "name": "No Token Team",
        "captain_name": "Captain",
        "captain_photo_url": "https://example.com/captain.png",
        "coordinator_name": "Coordinator",
        "coordinator_photo_url": "https://example.com/coordinator.png",
    }
    response = client.post("/api/teams", json=team_payload)
    assert response.status_code == 401
    response = client.patch("/api/players/1/payment", json={"payment_status": "paid"})
    assert response.status_code == 401


def test_verifier_cannot_call_admin_endpoint_but_admin_can(client: TestClient) -> None:
    team_payload = {
        "name": "Protected Team",
        "captain_name": "Captain",
        "captain_photo_url": "https://example.com/captain.png",
        "coordinator_name": "Coordinator",
        "coordinator_photo_url": "https://example.com/coordinator.png",
    }
    verifier_token = login(client, "verifier")
    response = client.post(
        "/api/teams",
        json=team_payload,
        headers={"Authorization": f"Bearer {verifier_token}"},
    )
    assert response.status_code == 403

    admin_token = login(client, "admin")
    response = client.post(
        "/api/teams",
        json=team_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201


def test_verifier_can_update_payment_and_authenticated_list_includes_all_players(client: TestClient) -> None:
    payload = {
        "roll_number": "AUTH-PAID-01",
        "mobile": "9123456780",
        "name": "Paid Test Player",
        "photo_url": "https://example.com/player.png",
        "course": "BTech",
        "branch": "CSE",
        "year": 1,
        "base_price": 40,
        "skill_type": "batting",
        "batting_style": "aggressive batter",
    }
    paid_player = client.post("/api/players", json=payload).json()
    payload.update(roll_number="AUTH-UNPAID-02", name="Unpaid Test Player", mobile="9123456781")
    unpaid_player = client.post("/api/players", json=payload).json()
    verifier_token = login(client, "verifier")
    headers = {"Authorization": f"Bearer {verifier_token}"}

    response = client.patch(
        f"/api/players/{paid_player['id']}/payment",
        json={"payment_status": "paid"},
        headers=headers,
    )
    assert response.status_code == 200

    public_response = client.get("/api/players")
    assert public_response.status_code == 200
    public_players = public_response.json()
    assert [player["id"] for player in public_players] == [paid_player["id"]]
    assert all("mobile" not in player for player in public_players)

    verifier_response = client.get("/api/players", headers=headers)
    assert verifier_response.status_code == 200
    private_players = verifier_response.json()
    assert {player["id"] for player in private_players} == {paid_player["id"], unpaid_player["id"]}
    assert all("mobile" in player for player in private_players)
