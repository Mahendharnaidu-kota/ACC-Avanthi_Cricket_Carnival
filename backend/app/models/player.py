from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (
        CheckConstraint("year >= 1 AND year <= 4", name="ck_players_year_range"),
        CheckConstraint("base_price > 0", name="ck_players_base_price_positive"),
        CheckConstraint(
            "payment_status IN ('paid', 'not_paid')", name="ck_players_payment_status"
        ),
        CheckConstraint(
            "auction_status IN ('available', 'sold', 'passed', 'unsold')",
            name="ck_players_auction_status",
        ),
        CheckConstraint(
            "skill_type IN ('batting', 'bowling', 'allrounder')",
            name="ck_players_skill_type",
        ),
        CheckConstraint(
            "batting_style IS NULL OR batting_style IN ('strike rotator', 'aggressive batter', 'big hitter')",
            name="ck_players_batting_style",
        ),
        CheckConstraint(
            "bowling_style IS NULL OR bowling_style IN ('fast', 'spin')",
            name="ck_players_bowling_style",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    roll_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    mobile: Mapped[str] = mapped_column(String(10))
    name: Mapped[str] = mapped_column(String(200), index=True)
    photo_url: Mapped[str] = mapped_column(String(2048))
    course: Mapped[str] = mapped_column(String(20), index=True)
    branch: Mapped[str] = mapped_column(String(50), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    cricheroes_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    base_price: Mapped[int] = mapped_column(Integer)
    skill_type: Mapped[str] = mapped_column(String(20))
    batting_style: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bowling_style: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_wicket_keeper: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payment_status: Mapped[str] = mapped_column(
        String(20), default="not_paid", nullable=False, index=True
    )
    auction_status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False, index=True
    )
    sold_to_team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    sold_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    sold_to_team: Mapped["Team | None"] = relationship(back_populates="players")
