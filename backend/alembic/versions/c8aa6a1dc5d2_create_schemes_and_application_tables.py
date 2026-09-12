"""create_schemes_and_application_tables

Revision ID: c8aa6a1dc5d2
Revises: 
Create Date: 2026-09-10 12:05:11.417664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c8aa6a1dc5d2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to create schemes, user_profiles, and applications tables."""
    # 1. Create schemes table
    op.create_table(
        'schemes',
        sa.Column('scheme_id', sa.String(length=100), primary_key=True, nullable=False),
        sa.Column('scheme_name', sa.Text(), nullable=False),
        sa.Column('ministry', sa.Text(), nullable=True),
        sa.Column('categories', postgresql.ARRAY(sa.Text()), nullable=True, server_default='{}'),
        sa.Column('max_income', sa.Integer(), nullable=True),
        sa.Column('eligible_states', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('business_types', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('benefit_amount', sa.Text(), nullable=True),
        sa.Column('documents_req', postgresql.ARRAY(sa.Text()), nullable=True, server_default='{}'),
        sa.Column('application_url', sa.Text(), nullable=True),
        sa.Column('source', sa.Text(), nullable=True, server_default='myscheme.gov.in'),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('eligibility_text', sa.Text(), nullable=True),
        sa.Column('last_verified', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )

    # 2. Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('phone_hash', sa.Text(), nullable=True, unique=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('income', sa.Integer(), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('business_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_user_profiles_phone_hash', 'user_profiles', ['phone_hash'], unique=True)

    # 3. Create applications table
    op.create_table(
        'applications',
        sa.Column('application_id', sa.String(length=20), primary_key=True, nullable=False),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.profile_id'), nullable=True),
        sa.Column('scheme_id', sa.String(length=100), sa.ForeignKey('schemes.scheme_id'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='submitted'),
        sa.Column('submitted_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_updated', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('submitted','under_review','approved','rejected')", name='valid_status'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('applications')
    op.drop_index('ix_user_profiles_phone_hash', table_name='user_profiles')
    op.drop_table('user_profiles')
    op.drop_table('schemes')
