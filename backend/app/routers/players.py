from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    AuthPrincipal,
    get_current_admin,
    get_current_verifier_or_admin,
    get_optional_current_principal,
)
from app.models import Player
from app.schemas.enums import Course, PaymentStatus
from app.schemas.player import BasePriceUpdate, PaymentUpdate, PlayerCreate, PlayerRead, PublicPlayerRead

router = APIRouter(prefix="/players", tags=["players"])


@router.post("", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
def register_player(payload: PlayerCreate, db: Session = Depends(get_db)) -> Player:
    player = Player(**payload.model_dump(mode="json"))
    db.add(player)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="roll_number already exists") from exc
    db.refresh(player)
    return player


@router.get("", response_model=list[PlayerRead | PublicPlayerRead])
def list_players(
    payment_status: PaymentStatus | None = None,
    course: Course | None = None,
    year: int | None = Query(default=None, ge=1, le=4),
    branch: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    principal: AuthPrincipal | None = Depends(get_optional_current_principal),
) -> list[PlayerRead | PublicPlayerRead]:
    statement = select(Player)
    if principal is None:
        statement = statement.where(Player.payment_status == PaymentStatus.PAID.value)
    elif payment_status is not None:
        statement = statement.where(Player.payment_status == payment_status.value)
    if course is not None:
        statement = statement.where(Player.course == course.value)
    if year is not None:
        statement = statement.where(Player.year == year)
    if branch:
        statement = statement.where(Player.branch == branch)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(Player.name.ilike(pattern) | Player.roll_number.ilike(pattern))
    players = list(db.scalars(statement.order_by(Player.name.asc(), Player.id.asc())).all())
    if principal is None:
        return [PublicPlayerRead.model_validate(player) for player in players]
    return players


@router.patch("/{id}/payment", response_model=PlayerRead)
def update_payment(
    id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_verifier_or_admin),
) -> Player:
    player = db.get(Player, id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    player.payment_status = payload.payment_status.value
    db.commit()
    db.refresh(player)
    return player


@router.patch("/{id}/base-price", response_model=PlayerRead)
def update_base_price(
    id: int,
    payload: BasePriceUpdate,
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> Player:
    player = db.get(Player, id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    player.base_price = payload.base_price
    if player.auction_status in {"passed", "unsold"}:
        player.auction_status = "available"
    db.commit()
    db.refresh(player)
    return player


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    id: int,
    db: Session = Depends(get_db),
    _: AuthPrincipal = Depends(get_current_admin),
) -> None:
    player = db.get(Player, id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
