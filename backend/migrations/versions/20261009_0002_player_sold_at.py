"""Add sale timestamp to players.

Revision ID: 20261009_0002
Revises: 20261008_0001
Create Date: 2026-10-09
"""
from alembic import op
import sqlalchemy as sa


revision = "20261009_0002"
down_revision = "20261008_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("players", sa.Column("sold_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("players", "sold_at")
