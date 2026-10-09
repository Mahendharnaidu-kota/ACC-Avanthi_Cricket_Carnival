"""Database operations for the auction state machine."""

from datetime import UTC, datetime, timedelta
from math import ceil

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AuctionState, Player, Team
from app.schemas.auction import AuctionPublicState
from app.services.auction_rules import can_team_bid, get_next_price, get_team_status

AUCTION_CATEGORIES = (
    "BTech 1st", "BTech 2nd", "BTech 3rd", "BTech 4th", "Diploma", "MCA", "MBA", "MTech"
)
AUCTION_DURATION = timedelta(seconds=20)


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def get_locked_state(db: Session) -> AuctionState:
    state = db.scalar(select(AuctionState).where(AuctionState.id == 1).with_for_update())
    if state is None:
        db.add(AuctionState(id=1, current_price=0, status="idle"))
        db.commit()
        state = db.scalar(select(AuctionState).where(AuctionState.id == 1).with_for_update())
    if state is None:
        raise RuntimeError("Could not initialize the auction state row")
    return state


def _find_available_player(db: Session, category: str, exclude_player_id: int | None = None) -> Player | None:
    statement = select(Player).where(
        Player.payment_status == "paid",
        Player.auction_status == "available",
    )
    if category.startswith("BTech "):
        year = {"BTech 1st": 1, "BTech 2nd": 2, "BTech 3rd": 3, "BTech 4th": 4}[category]
        statement = statement.where(Player.course == "BTech", Player.year == year)
    elif category == "Diploma":
        statement = statement.where(Player.course == "Diploma")
    else:
        statement = statement.where(Player.course == category)
    if exclude_player_id is not None:
        statement = statement.where(Player.id != exclude_player_id)
    return db.scalar(statement.order_by(func.random()).limit(1))


def _load_player_into_state(state: AuctionState, player: Player, category: str) -> None:
    state.current_player_id = player.id
    state.selected_category = category
    state.current_price = player.base_price
    state.leading_team_id = None
    state.status = "idle"
    state.timer_ends_at = None
    state.message = None


def _get_current_player(db: Session, state: AuctionState) -> Player | None:
    if state.current_player_id is None:
        return None
    return db.get(Player, state.current_player_id)


def _finalize_locked_state(db: Session, state: AuctionState, now: datetime) -> bool:
    if state.status != "running" or state.timer_ends_at is None:
        return False
    if _as_utc(state.timer_ends_at) > now:
        return False

    player = _get_current_player(db, state)
    team = db.get(Team, state.leading_team_id) if state.leading_team_id is not None else None
    if player is not None and team is not None:
        player.auction_status = "sold"
        player.sold_to_team_id = team.id
        player.sold_price = state.current_price
        team.purse -= state.current_price
        state.status = "sold"
        state.message = f"SOLD to {team.name} for {state.current_price}"
    else:
        if player is not None:
            player.auction_status = "unsold"
        state.status = "unsold"
        state.message = "UNSOLD - no bids were placed" if state.leading_team_id is None else "UNSOLD - leading team is no longer available"
    state.timer_ends_at = None
    db.commit()
    return True


def finalize_expired_auction(db: Session, now: datetime | None = None) -> bool:
    """Finalize an expired running auction once, under the singleton row lock."""
    state = get_locked_state(db)
    changed = _finalize_locked_state(db, state, now or _utc_now())
    if not changed:
        db.rollback()
    return changed


def select_category(db: Session, category: str) -> AuctionState:
    if category not in AUCTION_CATEGORIES:
        raise HTTPException(status_code=422, detail="Invalid auction category")
    state = get_locked_state(db)
    if state.status == "running":
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot select a category while the auction is running")
    player = _find_available_player(db, category)
    if player is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="No players left in this category")
    _load_player_into_state(state, player, category)
    db.commit()
    return state


def start_auction(db: Session) -> AuctionState:
    state = get_locked_state(db)
    if state.current_player_id is None:
        db.rollback()
        raise HTTPException(status_code=409, detail="Select a player before starting the auction")
    if state.status != "idle":
        db.rollback()
        raise HTTPException(status_code=409, detail="Auction can only start from idle status")
    state.status = "running"
    state.timer_ends_at = _utc_now() + AUCTION_DURATION
    state.message = None
    db.commit()
    return state


def place_bid(db: Session, team_id: int, now: datetime | None = None) -> tuple[AuctionState, bool]:
    state = get_locked_state(db)
    did_finalize = _finalize_locked_state(db, state, now or _utc_now())
    if did_finalize:
        return state, True
    current_time = now or _utc_now()
    if state.status != "running":
        db.rollback()
        raise HTTPException(status_code=409, detail="Bids are only accepted while the auction is running")
    if state.timer_ends_at is None or _as_utc(state.timer_ends_at) <= current_time:
        db.rollback()
        raise HTTPException(status_code=409, detail="The auction timer has expired")
    if state.leading_team_id == team_id:
        db.rollback()
        raise HTTPException(status_code=400, detail="The leading team cannot bid against itself")

    team = db.scalar(select(Team).where(Team.id == team_id).with_for_update())
    if team is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="Team not found")
    player = _get_current_player(db, state)
    if player is None:
        db.rollback()
        raise HTTPException(status_code=409, detail="There is no current player")
    bought_players = list(db.scalars(select(Player).where(Player.sold_to_team_id == team.id)).all())
    new_price = get_next_price(state.current_price)
    allowed, reason = can_team_bid(team, bought_players, player, new_price)
    if not allowed:
        db.rollback()
        raise HTTPException(status_code=400, detail=reason)
    state.current_price = new_price
    state.leading_team_id = team.id
    state.timer_ends_at = current_time + AUCTION_DURATION
    state.message = None
    db.commit()
    return state, False


def next_player(db: Session) -> AuctionState:
    state = get_locked_state(db)
    if state.status == "running":
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot load the next player while the auction is running")
    if state.selected_category is None:
        db.rollback()
        raise HTTPException(status_code=409, detail="Select a category before loading the next player")
    player = _find_available_player(db, state.selected_category, state.current_player_id)
    if player is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="No players left in this category")
    _load_player_into_state(state, player, state.selected_category)
    db.commit()
    return state


def pass_current_player(db: Session) -> AuctionState:
    state = get_locked_state(db)
    if state.status == "running":
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot pass a player while the auction is running")
    if state.current_player_id is None or state.selected_category is None:
        db.rollback()
        raise HTTPException(status_code=409, detail="There is no current player to pass")
    current_id = state.current_player_id
    current_player = _get_current_player(db, state)
    if current_player is not None:
        current_player.auction_status = "passed"
    player = _find_available_player(db, state.selected_category, current_id)
    if player is None:
        state.current_player_id = None
        state.current_price = 0
        state.leading_team_id = None
        state.timer_ends_at = None
        state.status = "idle"
        state.message = "No players left in this category"
    else:
        _load_player_into_state(state, player, state.selected_category)
    db.commit()
    return state


def public_state(db: Session, now: datetime | None = None) -> tuple[AuctionPublicState, bool]:
    state = get_locked_state(db)
    did_finalize = _finalize_locked_state(db, state, now or _utc_now())
    player = _get_current_player(db, state)
    team = db.get(Team, state.leading_team_id) if state.leading_team_id is not None else None
    seconds_remaining = None
    if state.status == "running" and state.timer_ends_at is not None:
        seconds_remaining = max(0, ceil((_as_utc(state.timer_ends_at) - (now or _utc_now())).total_seconds()))

    result = AuctionPublicState(
        current_player=(
            {
                "id": player.id,
                "name": player.name,
                "photo_url": player.photo_url,
                "skill_type": player.skill_type,
                "batting_style": player.batting_style,
                "bowling_style": player.bowling_style,
                "is_wicket_keeper": player.is_wicket_keeper,
                "course": player.course,
                "year": player.year,
                "base_price": player.base_price,
            }
            if player is not None else None
        ),
        current_price=state.current_price,
        leading_team={"id": team.id, "name": team.name} if team is not None else None,
        seconds_remaining=seconds_remaining,
        status=state.status,
        selected_category=state.selected_category,
        message=state.message,
        timer_ends_at=state.timer_ends_at,
    )
    if not did_finalize:
        db.rollback()
    return result, did_finalize


def team_summaries(db: Session) -> list[dict[str, object]]:
    teams = list(db.scalars(select(Team).order_by(Team.id)).all())
    summaries = []
    for team in teams:
        bought_players = list(db.scalars(
            select(Player).where(Player.sold_to_team_id == team.id, Player.auction_status == "sold")
        ).all())
        summaries.append({
            "id": team.id,
            "name": team.name,
            "purse_remaining": team.purse,
            "total_players": len(bought_players),
            "max_players": 15,
            "categories": get_team_status(bought_players),
        })
    return summaries
