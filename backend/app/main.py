import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.auction import router as auction_router, websocket_router as auction_websocket_router
from app.routers.players import router as players_router
from app.routers.teams import router as teams_router
from app.services.auction_live import auction_timer_loop


@asynccontextmanager
async def lifespan(_: FastAPI):
    timer_task = asyncio.create_task(auction_timer_loop())
    try:
        yield
    finally:
        timer_task.cancel()
        try:
            await timer_task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Avanthi Cricket Carnival API", lifespan=lifespan)

configured_cors_origins = os.getenv("CORS_ORIGINS")
cors_origins = (
    [origin.strip() for origin in configured_cors_origins.split(",") if origin.strip()]
    if configured_cors_origins is not None
    else ["http://localhost:5173", "http://127.0.0.1:5173"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(auction_router, prefix="/api")
app.include_router(auction_websocket_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Avanthi Cricket Carnival API is running"}
