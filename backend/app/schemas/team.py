from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.schemas.player import PlayerRead


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    captain_name: str = Field(min_length=1, max_length=200)
    captain_photo_url: HttpUrl
    coordinator_name: str = Field(min_length=1, max_length=200)
    coordinator_photo_url: HttpUrl


class TeamUpdate(TeamCreate):
    pass


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    captain_name: str
    captain_photo_url: str
    coordinator_name: str
    coordinator_photo_url: str
    purse: int
    players: list[PlayerRead]
