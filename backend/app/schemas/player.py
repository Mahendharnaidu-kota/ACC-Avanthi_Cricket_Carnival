import re
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.constants import BASE_PRICES, BRANCHES_BY_COURSE
from app.schemas.enums import AuctionStatus, Course, PaymentStatus, SkillType


class PlayerCreate(BaseModel):
    roll_number: str = Field(min_length=1, max_length=50)
    mobile: str
    name: str = Field(min_length=1, max_length=200)
    photo_url: HttpUrl
    course: Course
    branch: str = Field(min_length=1, max_length=50)
    year: int = Field(ge=1, le=4)
    cricheroes_url: HttpUrl | None = None
    base_price: int
    skill_type: SkillType
    batting_style: str | None = None
    bowling_style: str | None = None
    is_wicket_keeper: bool = False

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        if not re.fullmatch(r"\d{10}", value):
            raise ValueError("mobile must contain exactly 10 digits")
        return value

    @field_validator("base_price")
    @classmethod
    def validate_base_price(cls, value: int) -> int:
        if value not in BASE_PRICES:
            raise ValueError(f"base_price must be one of {sorted(BASE_PRICES)}")
        return value

    @field_validator("batting_style")
    @classmethod
    def validate_batting_style(cls, value: str | None) -> str | None:
        if value is not None and value not in {"strike rotator", "aggressive batter", "big hitter"}:
            raise ValueError("invalid batting_style")
        return value

    @field_validator("bowling_style")
    @classmethod
    def validate_bowling_style(cls, value: str | None) -> str | None:
        if value is not None and value not in {"fast", "spin"}:
            raise ValueError("invalid bowling_style")
        return value

    @model_validator(mode="after")
    def validate_course_branch_and_skill(self) -> Self:
        allowed_branches = BRANCHES_BY_COURSE[self.course]
        if self.branch not in allowed_branches:
            raise ValueError(
                f"branch must be one of {sorted(allowed_branches)} for {self.course.value}"
            )
        if self.skill_type == SkillType.BATTING:
            if self.batting_style is None or self.bowling_style is not None:
                raise ValueError("batting requires batting_style and forbids bowling_style")
        elif self.skill_type == SkillType.BOWLING:
            if self.bowling_style is None or self.batting_style is not None:
                raise ValueError("bowling requires bowling_style and forbids batting_style")
        elif self.batting_style is not None or self.bowling_style is not None:
            raise ValueError("allrounder cannot have batting_style or bowling_style")
        return self


class PlayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roll_number: str
    mobile: str
    name: str
    photo_url: str
    course: str
    branch: str
    year: int
    cricheroes_url: str | None
    base_price: int
    skill_type: str
    batting_style: str | None
    bowling_style: str | None
    is_wicket_keeper: bool
    payment_status: PaymentStatus
    auction_status: AuctionStatus
    sold_to_team_id: int | None
    sold_price: int | None
    created_at: datetime


class PublicPlayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roll_number: str
    name: str
    photo_url: str
    course: str
    branch: str
    year: int
    cricheroes_url: str | None
    base_price: int
    skill_type: str
    batting_style: str | None
    bowling_style: str | None
    is_wicket_keeper: bool
    payment_status: PaymentStatus
    auction_status: AuctionStatus
    sold_to_team_id: int | None
    sold_price: int | None
    created_at: datetime


class PaymentUpdate(BaseModel):
    payment_status: PaymentStatus


class BasePriceUpdate(BaseModel):
    base_price: int

    @field_validator("base_price")
    @classmethod
    def validate_base_price(cls, value: int) -> int:
        if value not in BASE_PRICES:
            raise ValueError(f"base_price must be one of {sorted(BASE_PRICES)}")
        return value
