"""WebSocket connection manager and server-side auction timer loop."""

import asyncio
import logging

from fastapi import WebSocket

from app.database import SessionLocal
from app.services.auction_engine import finalize_expired_auction, public_state

logger = logging.getLogger(__name__)


class AuctionConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def send_to(self, websocket: WebSocket, payload: dict[str, object]) -> None:
        await websocket.send_json(payload)

    async def broadcast(self, payload: dict[str, object]) -> None:
        stale: list[WebSocket] = []
        for websocket in tuple(self._connections):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)


auction_connections = AuctionConnectionManager()


async def broadcast_current_state() -> None:
    db = SessionLocal()
    try:
        state, did_finalize = public_state(db)
        payload = state.model_dump(mode="json")
        if did_finalize:
            logger.info("Finalized expired auction while preparing a broadcast")
        await auction_connections.broadcast(payload)
    finally:
        db.close()


async def auction_timer_loop() -> None:
    while True:
        await asyncio.sleep(1)
        db = SessionLocal()
        try:
            if finalize_expired_auction(db):
                state, _ = public_state(db)
                await auction_connections.broadcast(state.model_dump(mode="json"))
        except Exception:
            logger.exception("Auction timer check failed")
        finally:
            db.close()
