"""Pure rules used by the cricket auction.

These helpers accept mappings or objects with the corresponding attributes and
do not access persistence or application state.
"""

from collections.abc import Mapping, Sequence
from typing import Any, TypedDict


MANDATORY_CATEGORIES: tuple[str, ...] = (
    "BTech 1st",
    "BTech 2nd",
    "BTech 3rd",
    "BTech 4th",
    "Diploma",
)
ALL_CATEGORIES: tuple[str, ...] = (*MANDATORY_CATEGORIES, "Others")
TEAM_PURSE = 1000
MAX_TEAM_PLAYERS = 15
MINIMUM_CATEGORY_PLAYERS = 2
MINIMUM_RESERVE_PER_SLOT = 10


class CategoryStatus(TypedDict):
    count: int
    requirement_met: bool


def _value(item: Any, key: str, default: Any = None) -> Any:
    if isinstance(item, Mapping):
        return item.get(key, default)
    return getattr(item, key, default)


def _course_name(course: Any) -> str:
    return str(getattr(course, "value", course))


def get_next_price(current_price: int) -> int:
    """Return the next legal bid increment for the current auction price."""
    if current_price < 100:
        return current_price + 10
    if current_price < 200:
        return current_price + 20
    return current_price + 30


def get_category(player: Any) -> str:
    """Map a player's course/year to an auction category."""
    course = _course_name(_value(player, "course", ""))
    if course == "BTech":
        year = _value(player, "year")
        if year in (1, 2, 3, 4):
            return f"BTech {('1st', '2nd', '3rd', '4th')[year - 1]}"
    elif course == "Diploma":
        return "Diploma"
    return "Others"


def _category_counts(bought_players: Sequence[Any]) -> dict[str, int]:
    counts = {category: 0 for category in ALL_CATEGORIES}
    for player in bought_players:
        counts[get_category(player)] += 1
    return counts


def can_team_bid(
    team: Any,
    bought_players: Sequence[Any],
    player: Any,
    new_price: int,
) -> tuple[bool, str]:
    """Check player limit, available purse, and mandatory category reserves.

    ``team.purse`` is the team's current unspent purse. It defaults to 1000
    when passed a simple object without a purse field.
    """
    if len(bought_players) >= MAX_TEAM_PLAYERS:
        return False, "The team already has the maximum of 15 players."

    purse = _value(team, "purse", TEAM_PURSE)
    if new_price > purse:
        return False, f"The bid of {new_price} exceeds the remaining purse of {purse}."

    counts_after_purchase = _category_counts(bought_players)
    counts_after_purchase[get_category(player)] += 1
    remaining_slots = sum(
        max(0, MINIMUM_CATEGORY_PLAYERS - counts_after_purchase[category])
        for category in MANDATORY_CATEGORIES
    )
    purse_after_purchase = purse - new_price
    reserve_required = remaining_slots * MINIMUM_RESERVE_PER_SLOT

    if purse_after_purchase < reserve_required:
        return (
            False,
            "After this bid, the remaining purse cannot cover the minimum 10 for "
            f"each of the {remaining_slots} unfilled mandatory player slots "
            f"(requires {reserve_required}; would have {purse_after_purchase}).",
        )

    return True, "Bid allowed."


def get_team_status(bought_players: Sequence[Any]) -> dict[str, CategoryStatus]:
    """Return category counts and whether each category's requirement is met."""
    counts = _category_counts(bought_players)
    return {
        category: {
            "count": counts[category],
            "requirement_met": (
                True
                if category == "Others"
                else counts[category] >= MINIMUM_CATEGORY_PLAYERS
            ),
        }
        for category in ALL_CATEGORIES
    }
