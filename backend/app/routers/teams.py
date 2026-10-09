from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.constants import MAX_TEAMS, team_limit_reached
from app.database import get_db
from app.dependencies import require_admin
from app.models import AuctionState, Player, Team
from app.schemas.team import TeamCreate, TeamRead, TeamUpdate

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
) -> Team:
    count = db.scalar(select(func.count()).select_from(Team)) or 0
    if team_limit_reached(count):
        raise HTTPException(status_code=409, detail=f"A maximum of {MAX_TEAMS} teams is allowed")
    team = Team(**payload.model_dump(mode="json"))
    db.add(team)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Team name already exists") from exc
    return db.scalar(
        select(Team).where(Team.id == team.id).options(selectinload(Team.players))
    )


@router.get("", response_model=list[TeamRead])
def list_teams(db: Session = Depends(get_db)) -> list[Team]:
    statement = select(Team).options(selectinload(Team.players)).order_by(Team.id)
    return list(db.scalars(statement).all())


@router.put("/{id}", response_model=TeamRead)
def update_team(
    id: int,
    payload: TeamUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
) -> Team:
    team = db.get(Team, id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    for key, value in payload.model_dump(mode="json").items():
        setattr(team, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Team name already exists") from exc
    return db.scalar(
        select(Team).where(Team.id == id).options(selectinload(Team.players))
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
) -> None:
    team = db.get(Team, id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    db.query(Player).filter(Player.sold_to_team_id == id).update(
        {Player.sold_to_team_id: None}, synchronize_session=False
    )
    db.query(AuctionState).filter(AuctionState.leading_team_id == id).update(
        {AuctionState.leading_team_id: None}, synchronize_session=False
    )
    db.delete(team)
    db.commit()
