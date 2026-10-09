from datetime import datetime
from typing import Literal

from pydantic import BaseModel

AuctionCategory = Literal[
    "BTech 1st",
    "BTech 2nd",
    "BTech 3rd",
    "BTech 4th",
    "Diploma",
    "MCA",
    "MBA",
    "MTech",
]


class SelectCategoryRequest(BaseModel):
    category: AuctionCategory


class BidRequest(BaseModel):
    team_id: int


class AuctionPlayerState(BaseModel):
    id: int
    name: str
    photo_url: str
    skill_type: str
    batting_style: str | None
    bowling_style: str | None
    is_wicket_keeper: bool
    course: str
    year: int
    base_price: int


class AuctionLeadingTeam(BaseModel):
    id: int
    name: str


class AuctionPublicState(BaseModel):
    current_player: AuctionPlayerState | None
    current_price: int
    leading_team: AuctionLeadingTeam | None
    seconds_remaining: int | None
    status: Literal["idle", "running", "sold", "unsold"]
    selected_category: str | None
    message: str | None
    timer_ends_at: datetime | None


class AuctionCategoryStatus(BaseModel):
    count: int
    requirement_met: bool


class AuctionTeamSummary(BaseModel):
    id: int
    name: str
    purse_remaining: int
    total_players: int
    max_players: int
    categories: dict[str, AuctionCategoryStatus]


class RecentSale(BaseModel):
    player_name: str
    course: str
    year: int
    team_name: str
    sold_price: int
    sold_at: datetime | None
