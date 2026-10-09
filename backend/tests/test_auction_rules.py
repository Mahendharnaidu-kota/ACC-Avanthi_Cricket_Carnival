from types import SimpleNamespace

import pytest

from app.services.auction_rules import (
    ALL_CATEGORIES,
    can_team_bid,
    get_category,
    get_next_price,
    get_team_status,
)


@pytest.mark.parametrize(
    ("current_price", "expected"),
    [(40, 50), (90, 100), (100, 120), (190, 210), (200, 230)],
)
def test_get_next_price(current_price, expected):
    assert get_next_price(current_price) == expected


@pytest.mark.parametrize(
    ("course", "year", "expected"),
    [
        ("BTech", 1, "BTech 1st"),
        ("BTech", 2, "BTech 2nd"),
        ("BTech", 3, "BTech 3rd"),
        ("BTech", 4, "BTech 4th"),
        ("Diploma", 1, "Diploma"),
        ("MBA", 1, "Others"),
        ("MCA", 2, "Others"),
        ("MTech", 3, "Others"),
    ],
)
def test_get_category(course, year, expected):
    assert get_category(SimpleNamespace(course=course, year=year)) == expected


def player(course="BTech", year=1):
    return SimpleNamespace(course=course, year=year)


def team(purse=1000):
    return SimpleNamespace(purse=purse)


def mandatory_roster():
    return [
        player(course, year)
        for course, year in (
            ("BTech", 1), ("BTech", 1),
            ("BTech", 2), ("BTech", 2),
            ("BTech", 3), ("BTech", 3),
            ("BTech", 4), ("BTech", 4),
            ("Diploma", 1), ("Diploma", 2),
        )
    ]


def test_full_team_is_blocked():
    roster = [player("MBA", 1) for _ in range(15)]
    allowed, reason = can_team_bid(team(), roster, player(), 10)
    assert not allowed
    assert "maximum of 15" in reason


def test_bid_exceeding_remaining_purse_is_blocked():
    allowed, reason = can_team_bid(team(purse=5), [], player(), 10)
    assert not allowed
    assert "exceeds the remaining purse" in reason


def test_bid_blocked_when_remaining_purse_cannot_cover_mandatory_slots():
    bought = [player("MBA", 1) for _ in range(2)]
    allowed, reason = can_team_bid(team(purse=1000), bought, player("BTech", 1), 920)
    assert not allowed
    assert "cannot cover" in reason
    assert "9 unfilled mandatory player slots" in reason


def test_team_with_all_mandatory_slots_filled_can_buy_free_slot_player():
    allowed, reason = can_team_bid(team(), mandatory_roster(), player("MCA", 1), 10)
    assert allowed
    assert reason == "Bid allowed."


def test_team_status_reports_six_categories_and_requirements():
    status = get_team_status([player("BTech", 1), player("Diploma", 1), player("MBA", 1)])
    assert tuple(status) == ALL_CATEGORIES
    assert status["BTech 1st"] == {"count": 1, "requirement_met": False}
    assert status["BTech 2nd"] == {"count": 0, "requirement_met": False}
    assert status["Diploma"] == {"count": 1, "requirement_met": False}
    assert status["Others"] == {"count": 1, "requirement_met": True}
