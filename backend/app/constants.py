from typing import Final

from app.schemas.enums import Course

BASE_PRICES: Final[frozenset[int]] = frozenset(
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250]
)

# Update these three lists when the college confirms its official branch names.
BRANCHES_BY_COURSE: Final[dict[Course, frozenset[str]]] = {
    Course.BTECH: frozenset({"CSE", "CSM", "CSD", "ECE", "EEE", "MECH"}),
    Course.DIPLOMA: frozenset({"CM", "EC", "EE", "M"}),
    Course.MBA: frozenset({"General"}),
    Course.MCA: frozenset({"General"}),
    Course.MTECH: frozenset({"General"}),
}

MAX_TEAMS: Final[int] = 11


def team_limit_reached(current_count: int) -> bool:
    return current_count >= MAX_TEAMS
