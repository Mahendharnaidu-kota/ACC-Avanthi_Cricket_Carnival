from enum import Enum


class Course(str, Enum):
    BTECH = "BTech"
    DIPLOMA = "Diploma"
    MBA = "MBA"
    MCA = "MCA"
    MTECH = "MTech"


class SkillType(str, Enum):
    BATTING = "batting"
    BOWLING = "bowling"
    ALLROUNDER = "allrounder"


class PaymentStatus(str, Enum):
    PAID = "paid"
    NOT_PAID = "not_paid"


class AuctionStatus(str, Enum):
    AVAILABLE = "available"
    SOLD = "sold"
    PASSED = "passed"
    UNSOLD = "unsold"


class AuctionStateStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    SOLD = "sold"
    UNSOLD = "unsold"
