from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (CheckConstraint("purse >= 0", name="ck_teams_purse_nonnegative"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    captain_name: Mapped[str] = mapped_column(String(200))
    captain_photo_url: Mapped[str] = mapped_column(String(2048))
    coordinator_name: Mapped[str] = mapped_column(String(200))
    coordinator_photo_url: Mapped[str] = mapped_column(String(2048))
    purse: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)

    players: Mapped[list["Player"]] = relationship(back_populates="sold_to_team")
