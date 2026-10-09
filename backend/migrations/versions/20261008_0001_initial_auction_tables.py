"""Create initial auction tables.

Revision ID: 20261008_0001
Revises:
Create Date: 2026-10-08
"""
from alembic import op
import sqlalchemy as sa

revision = "20261008_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("captain_name", sa.String(length=200), nullable=False),
        sa.Column("captain_photo_url", sa.String(length=2048), nullable=False),
        sa.Column("coordinator_name", sa.String(length=200), nullable=False),
        sa.Column("coordinator_photo_url", sa.String(length=2048), nullable=False),
        sa.Column("purse", sa.Integer(), nullable=False, server_default="1000"),
        sa.CheckConstraint("purse >= 0", name="ck_teams_purse_nonnegative"),
        sa.UniqueConstraint("name", name="uq_teams_name"),
    )
    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("roll_number", sa.String(length=50), nullable=False),
        sa.Column("mobile", sa.String(length=10), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("photo_url", sa.String(length=2048), nullable=False),
        sa.Column("course", sa.String(length=20), nullable=False),
        sa.Column("branch", sa.String(length=50), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("cricheroes_url", sa.String(length=2048), nullable=True),
        sa.Column("base_price", sa.Integer(), nullable=False),
        sa.Column("skill_type", sa.String(length=20), nullable=False),
        sa.Column("batting_style", sa.String(length=30), nullable=True),
        sa.Column("bowling_style", sa.String(length=20), nullable=True),
        sa.Column("is_wicket_keeper", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("payment_status", sa.String(length=20), nullable=False, server_default="not_paid"),
        sa.Column("auction_status", sa.String(length=20), nullable=False, server_default="available"),
        sa.Column("sold_to_team_id", sa.Integer(), nullable=True),
        sa.Column("sold_price", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("year >= 1 AND year <= 4", name="ck_players_year_range"),
        sa.CheckConstraint("base_price > 0", name="ck_players_base_price_positive"),
        sa.CheckConstraint("payment_status IN ('paid', 'not_paid')", name="ck_players_payment_status"),
        sa.CheckConstraint("auction_status IN ('available', 'sold', 'passed', 'unsold')", name="ck_players_auction_status"),
        sa.CheckConstraint("skill_type IN ('batting', 'bowling', 'allrounder')", name="ck_players_skill_type"),
        sa.CheckConstraint("batting_style IS NULL OR batting_style IN ('strike rotator', 'aggressive batter', 'big hitter')", name="ck_players_batting_style"),
        sa.CheckConstraint("bowling_style IS NULL OR bowling_style IN ('fast', 'spin')", name="ck_players_bowling_style"),
        sa.ForeignKeyConstraint(["sold_to_team_id"], ["teams.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("roll_number", name="uq_players_roll_number"),
    )
    for col in ("roll_number", "name", "course", "branch", "year", "payment_status", "auction_status"):
        op.create_index(f"ix_players_{col}", "players", [col], unique=False)
    op.create_table(
        "auction_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("current_player_id", sa.Integer(), nullable=True),
        sa.Column("selected_category", sa.String(length=50), nullable=True),
        sa.Column("current_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("leading_team_id", sa.Integer(), nullable=True),
        sa.Column("timer_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="idle"),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_auction_state_single_row"),
        sa.CheckConstraint("status IN ('idle', 'running', 'sold', 'unsold')", name="ck_auction_state_status"),
        sa.ForeignKeyConstraint(["current_player_id"], ["players.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["leading_team_id"], ["teams.id"], ondelete="SET NULL"),
    )
    op.execute(
        sa.text(
            "INSERT INTO auction_state (id, current_price, status, updated_at) "
            "VALUES (1, 0, 'idle', CURRENT_TIMESTAMP)"
        )
    )


def downgrade() -> None:
    op.drop_table("auction_state")
    for col in ("auction_status", "payment_status", "year", "branch", "course", "name", "roll_number"):
        op.drop_index(f"ix_players_{col}", table_name="players")
    op.drop_table("players")
    op.drop_table("teams")
