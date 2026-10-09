from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuctionState(Base):
    __tablename__ = "auction_state"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_auction_state_single_row"),
        CheckConstraint(
            "status IN ('idle', 'running', 'sold', 'unsold')", name="ck_auction_state_status"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    current_player_id: Mapped[int | None] = mapped_column(
        ForeignKey("players.id", ondelete="SET NULL"), nullable=True
    )
    selected_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    leading_team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    timer_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="idle", nullable=False)
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
