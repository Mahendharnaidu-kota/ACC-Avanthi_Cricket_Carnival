from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import AuctionState, Player, Team
from app.services.auction_engine import finalize_expired_auction

TEST_ADMIN_USERNAME = "auction-test-admin"
TEST_ADMIN_PASSWORD = "auction-admin-password"
TEST_VERIFIER_USERNAME = "auction-test-verifier"
TEST_VERIFIER_PASSWORD = "auction-verifier-password"
TEST_JWT_SECRET = "auction-only-test-secret-long-enough-for-hs256"


@pytest.fixture
def auction_env(monkeypatch: pytest.MonkeyPatch):
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
    with TestClient(app) as client:
        yield client, TestingSessionLocal
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def token_for(client: TestClient, role: str = "admin") -> str:
    username, password = (
        (TEST_ADMIN_USERNAME, TEST_ADMIN_PASSWORD)
        if role == "admin"
        else (TEST_VERIFIER_USERNAME, TEST_VERIFIER_PASSWORD)
    )
    response = client.post(f"/api/{role}/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def add_player(session_factory, *, course="BTech", year=1, payment_status="paid", auction_status="available", base_price=40, name="Auction Player"):
    with session_factory() as db:
        suffix = f"{datetime.now(UTC).timestamp()}-{name}-{course}-{year}"
        player = Player(
            roll_number=suffix,
            mobile="9876543210",
            name=name,
            photo_url="https://example.com/player.png",
            course=course,
            branch="CSE" if course == "BTech" else "General" if course in {"MCA", "MBA", "MTech"} else "CM",
            year=year,
            base_price=base_price,
            skill_type="batting",
            batting_style="strike rotator",
            payment_status=payment_status,
            auction_status=auction_status,
        )
        db.add(player)
        db.commit()
        db.refresh(player)
        return player.id


def add_team(session_factory, *, purse=1000, name="Auction Test Team"):
    with session_factory() as db:
        team = Team(
            name=f"{name} {datetime.now(UTC).timestamp()}",
            captain_name="Captain",
            captain_photo_url="https://example.com/captain.png",
            coordinator_name="Coordinator",
            coordinator_photo_url="https://example.com/coordinator.png",
            purse=purse,
        )
        db.add(team)
        db.commit()
        return team.id


def select_player(client: TestClient, admin_headers: dict[str, str], category="BTech 1st"):
    response = client.post("/api/auction/select-category", json={"category": category}, headers=admin_headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_select_category_chooses_random_paid_available_player(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    eligible_one = add_player(session_factory, name="Eligible One")
    eligible_two = add_player(session_factory, name="Eligible Two")
    add_player(session_factory, payment_status="not_paid", name="Unpaid")
    add_player(session_factory, auction_status="sold", name="Already Sold")

    response = client.post("/api/auction/select-category", json={"category": "BTech 1st"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["current_player"]["id"] in {eligible_one, eligible_two}
    assert response.json()["current_price"] == 40
    assert response.json()["status"] == "idle"
    assert response.json()["leading_team"] is None


def test_select_category_with_none_left_does_not_change_current_player(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    current_id = add_player(session_factory, course="MCA", payment_status="not_paid", name="Current MCA")
    add_player(session_factory, course="MBA", payment_status="not_paid", name="No Available MBA")
    with session_factory() as db:
        db.add(AuctionState(id=1, current_player_id=current_id, selected_category="MCA", current_price=75, status="idle"))
        db.commit()

    response = client.post("/api/auction/select-category", json={"category": "MBA"}, headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "No players left in this category"
    state = client.get("/api/auction/state").json()
    assert state["current_player"]["id"] == current_id
    assert state["selected_category"] == "MCA"
    assert state["current_price"] == 75


def test_start_sets_running_status_and_twenty_second_timer(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory)
    select_player(client, admin_headers)
    response = client.post("/api/auction/start", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert 19 <= response.json()["seconds_remaining"] <= 20
    assert response.json()["timer_ends_at"] is not None


def test_valid_bid_increments_price_and_resets_timer(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory)
    team_id = add_team(session_factory)
    select_player(client, admin_headers)
    client.post("/api/auction/start", headers=admin_headers)
    before = client.get("/api/auction/state").json()["timer_ends_at"]

    response = client.post("/api/auction/bid", json={"team_id": team_id}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["current_price"] == 50
    assert response.json()["leading_team"]["id"] == team_id
    assert response.json()["timer_ends_at"] >= before


def test_blocked_bid_returns_reason_and_keeps_price_unchanged(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory)
    team_id = add_team(session_factory, purse=45)
    select_player(client, admin_headers)
    client.post("/api/auction/start", headers=admin_headers)

    response = client.post("/api/auction/bid", json={"team_id": team_id}, headers=admin_headers)
    assert response.status_code == 400
    assert "remaining purse" in response.json()["detail"]
    state = client.get("/api/auction/state").json()
    assert state["current_price"] == 40
    assert state["leading_team"] is None


def test_leading_team_cannot_outbid_itself(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory)
    team_id = add_team(session_factory)
    select_player(client, admin_headers)
    client.post("/api/auction/start", headers=admin_headers)
    first_bid = client.post("/api/auction/bid", json={"team_id": team_id}, headers=admin_headers)
    assert first_bid.status_code == 200

    second_bid = client.post("/api/auction/bid", json={"team_id": team_id}, headers=admin_headers)
    assert second_bid.status_code == 400
    assert "cannot bid against itself" in second_bid.json()["detail"]
    assert client.get("/api/auction/state").json()["current_price"] == 50


def test_sale_finalizes_once_and_deducts_purse_once(auction_env):
    client, session_factory = auction_env
    player_id = add_player(session_factory)
    team_id = add_team(session_factory, purse=1000)
    with session_factory() as db:
        db.add(AuctionState(
            id=1,
            current_player_id=player_id,
            selected_category="BTech 1st",
            current_price=50,
            leading_team_id=team_id,
            status="running",
            timer_ends_at=datetime.now(UTC) - timedelta(seconds=1),
        ))
        db.commit()
        assert finalize_expired_auction(db) is True
        assert finalize_expired_auction(db) is False
    with session_factory() as db:
        player = db.get(Player, player_id)
        team = db.get(Team, team_id)
        state = db.get(AuctionState, 1)
        assert player.auction_status == "sold"
        assert player.sold_to_team_id == team_id
        assert player.sold_price == 50
        assert team.purse == 950
        assert state.status == "sold"
        assert state.message == f"SOLD to {team.name} for 50"


def test_expired_no_bid_marks_player_unsold(auction_env):
    _, session_factory = auction_env
    player_id = add_player(session_factory)
    with session_factory() as db:
        db.add(AuctionState(
            id=1,
            current_player_id=player_id,
            selected_category="BTech 1st",
            current_price=40,
            status="running",
            timer_ends_at=datetime.now(UTC) - timedelta(seconds=1),
        ))
        db.commit()
        assert finalize_expired_auction(db) is True
    with session_factory() as db:
        assert db.get(Player, player_id).auction_status == "unsold"
        state = db.get(AuctionState, 1)
        assert state.status == "unsold"
        assert state.message == "UNSOLD - no bids were placed"


def test_pass_marks_player_and_loads_another(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    first_id = add_player(session_factory, name="Pass First")
    second_id = add_player(session_factory, name="Pass Second")
    selected = select_player(client, admin_headers)
    passed = client.post("/api/auction/pass", headers=admin_headers)
    assert passed.status_code == 200
    assert passed.json()["current_player"]["id"] in {first_id, second_id}
    assert passed.json()["current_player"]["id"] != selected["current_player"]["id"]
    with session_factory() as db:
        assert db.get(Player, first_id).auction_status == "available" or db.get(Player, first_id).auction_status == "passed"
        assert db.get(Player, second_id).auction_status == "available" or db.get(Player, second_id).auction_status == "passed"
        assert sum(db.get(Player, pid).auction_status == "passed" for pid in (first_id, second_id)) == 1
        assert passed.json()["current_player"]["id"] not in {
            pid for pid in (first_id, second_id) if db.get(Player, pid).auction_status == "passed"
        }


def test_next_loads_another_available_player(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory, name="Next First")
    add_player(session_factory, name="Next Second")
    first_state = select_player(client, admin_headers)
    response = client.post("/api/auction/next", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["current_player"]["id"] != first_state["current_player"]["id"]
    assert response.json()["status"] == "idle"


def test_admin_only_routes_reject_no_token_and_verifier(auction_env):
    client, _ = auction_env
    payload = {"category": "BTech 1st"}
    assert client.post("/api/auction/select-category", json=payload).status_code == 401
    verifier_headers = headers(token_for(client, "verifier"))
    assert client.post("/api/auction/select-category", json=payload, headers=verifier_headers).status_code == 403


def test_websocket_receives_current_state_and_change_broadcast(auction_env):
    client, session_factory = auction_env
    admin_headers = headers(token_for(client))
    add_player(session_factory, name="Socket Player")
    with client.websocket_connect("/ws/auction") as websocket:
        initial = websocket.receive_json()
        assert initial["current_player"] is None
        selected = client.post("/api/auction/select-category", json={"category": "BTech 1st"}, headers=admin_headers)
        assert selected.status_code == 200
        broadcast = websocket.receive_json()
        assert broadcast["current_player"]["name"] == "Socket Player"


def test_public_auction_teams_include_roster_status(auction_env):
    client, session_factory = auction_env
    team_id = add_team(session_factory)
    add_player(session_factory, auction_status="sold", name="Roster Player")
    with session_factory() as db:
        player = db.query(Player).filter_by(name="Roster Player").one()
        player.sold_to_team_id = team_id
        player.sold_price = 40
        db.commit()
    response = client.get("/api/auction/teams")
    assert response.status_code == 200
    team = next(row for row in response.json() if row["id"] == team_id)
    assert team["purse_remaining"] == 1000
    assert team["total_players"] == 1
    assert team["max_players"] == 15
    assert team["categories"]["BTech 1st"] == {"count": 1, "requirement_met": False}

