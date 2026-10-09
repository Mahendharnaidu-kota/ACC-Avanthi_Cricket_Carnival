from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.dependencies import AuthPrincipal, get_current_admin
from app.schemas.auction import (
    AuctionPublicState,
    AuctionTeamSummary,
    BidRequest,
    SelectCategoryRequest,
)
from app.services.auction_engine import (
    finalize_expired_auction,
    next_player,
    pass_current_player,
    place_bid,
    public_state,
    select_category,
    start_auction,
    team_summaries,
)
from app.services.auction_live import auction_connections

router = APIRouter(prefix="/auction", tags=["auction"])
websocket_router = APIRouter(tags=["auction"])


def _state_payload(db: Session) -> tuple[AuctionPublicState, bool]:
    payload, finalized = public_state(db)
    if not finalized:
        db.rollback()
    return payload, finalized


@router.post("/select-category", response_model=AuctionPublicState)
async def select_category_endpoint(
    payload: SelectCategoryRequest,
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> AuctionPublicState:
    select_category(db, payload.category)
    state, _ = _state_payload(db)
    await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.post("/start", response_model=AuctionPublicState)
async def start_endpoint(
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> AuctionPublicState:
    start_auction(db)
    state, _ = _state_payload(db)
    await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.post("/bid", response_model=AuctionPublicState)
async def bid_endpoint(
    payload: BidRequest,
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> AuctionPublicState:
    _, finalized = place_bid(db, payload.team_id)
    if finalized:
        state, _ = _state_payload(db)
        await auction_connections.broadcast(state.model_dump(mode="json"))
        raise HTTPException(status_code=409, detail="The auction timer expired; the result has been finalized")
    state, _ = _state_payload(db)
    await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.post("/next", response_model=AuctionPublicState)
async def next_endpoint(
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> AuctionPublicState:
    next_player(db)
    state, _ = _state_payload(db)
    await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.post("/pass", response_model=AuctionPublicState)
async def pass_endpoint(
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> AuctionPublicState:
    pass_current_player(db)
    state, _ = _state_payload(db)
    await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.get("/state", response_model=AuctionPublicState)
async def state_endpoint(db: Session = Depends(get_db)) -> AuctionPublicState:
    state, finalized = _state_payload(db)
    if finalized:
        await auction_connections.broadcast(state.model_dump(mode="json"))
    return state


@router.get("/teams", response_model=list[AuctionTeamSummary])
def auction_teams_endpoint(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    return team_summaries(db)


@websocket_router.websocket("/ws/auction")
async def auction_websocket(websocket: WebSocket) -> None:
    await auction_connections.connect(websocket)
    db = SessionLocal()
    try:
        state, finalized = _state_payload(db)
        payload = state.model_dump(mode="json")
        if finalized:
            await auction_connections.broadcast(payload)
        else:
            await auction_connections.send_to(websocket, payload)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        auction_connections.disconnect(websocket)
    finally:
        db.close()
