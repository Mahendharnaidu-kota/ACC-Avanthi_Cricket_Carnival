import pytest
from pydantic import ValidationError

from app.constants import MAX_TEAMS, team_limit_reached
from app.schemas.player import PlayerCreate


def valid_player(**overrides: object) -> dict[str, object]:
    player: dict[str, object] = {
        "roll_number": "ACC001",
        "mobile": "9876543210",
        "name": "Test Player",
        "photo_url": "https://example.com/player.jpg",
        "course": "BTech",
        "branch": "CSE",
        "year": 1,
        "base_price": 40,
        "skill_type": "batting",
        "batting_style": "strike rotator",
    }
    player.update(overrides)
    return player


@pytest.mark.parametrize("mobile", ["123456789", "12345678901", "12345abcde", "+919876543210"])
def test_mobile_must_be_exactly_ten_digits(mobile: str) -> None:
    with pytest.raises(ValidationError, match="exactly 10 digits"):
        PlayerCreate.model_validate(valid_player(mobile=mobile))


@pytest.mark.parametrize("base_price", [0, 15, 110, 260, -10])
def test_base_price_must_be_allowed(base_price: int) -> None:
    with pytest.raises(ValidationError, match="base_price must be one of"):
        PlayerCreate.model_validate(valid_player(base_price=base_price))


@pytest.mark.parametrize(
    ("course", "branch"),
    [("BTech", "CM"), ("Diploma", "CSE"), ("MBA", "CSE"), ("MCA", "M"), ("MTech", "EEE")],
)
def test_branch_must_match_course(course: str, branch: str) -> None:
    with pytest.raises(ValidationError, match="branch must be one of"):
        PlayerCreate.model_validate(valid_player(course=course, branch=branch))


def test_each_configured_course_branch_is_accepted() -> None:
    for course, branch in (("BTech", "ECE"), ("Diploma", "CM"), ("MBA", "General"), ("MCA", "General"), ("MTech", "General")):
        assert PlayerCreate.model_validate(valid_player(course=course, branch=branch))


@pytest.mark.parametrize(
    "overrides",
    [
        {"batting_style": None},
        {"batting_style": "big hitter", "bowling_style": "fast"},
        {"skill_type": "bowling", "batting_style": None, "bowling_style": None},
        {"skill_type": "bowling", "batting_style": "big hitter", "bowling_style": "spin"},
        {"skill_type": "allrounder", "batting_style": "strike rotator"},
        {"skill_type": "allrounder", "bowling_style": "fast"},
    ],
)
def test_skill_type_requires_only_its_matching_style(overrides: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PlayerCreate.model_validate(valid_player(**overrides))


def test_valid_bowling_and_allrounder_skills() -> None:
    bowling = valid_player(skill_type="bowling", batting_style=None, bowling_style="spin")
    allrounder = valid_player(skill_type="allrounder", batting_style=None)
    assert PlayerCreate.model_validate(bowling)
    assert PlayerCreate.model_validate(allrounder)


def test_wicket_keeper_can_be_combined_with_a_primary_skill() -> None:
    player = PlayerCreate.model_validate(valid_player(is_wicket_keeper=True))
    assert player.is_wicket_keeper is True


@pytest.mark.parametrize("year", [0, 5])
def test_year_must_be_between_one_and_four(year: int) -> None:
    with pytest.raises(ValidationError):
        PlayerCreate.model_validate(valid_player(year=year))


def test_cricheroes_url_is_optional() -> None:
    player = PlayerCreate.model_validate(valid_player())
    assert player.cricheroes_url is None


def test_team_limit_allows_eleven_but_blocks_more() -> None:
    assert MAX_TEAMS == 11
    assert team_limit_reached(10) is False
    assert team_limit_reached(11) is True
