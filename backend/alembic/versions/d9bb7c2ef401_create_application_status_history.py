"""create_application_status_history

Revision ID: d9bb7c2ef401
Revises: c8aa6a1dc5d2
Create Date: 2026-09-12 02:25:00.000000

"""
Import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'd9bb7c2ef401'
down_revision: Union[str, Sequence[str], None] = 'c8aa6a1dc5d2'
branch_labels: Union[str, Sequence["str"], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Alter applications table to add columns and update constraint
    op.add_column('applications', sa.Column('partner_id', sa.String(length=100), nullable=True))
    op.add_column('applications', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False))
    op.alter_column('applications', 'submitted_at', nullable=True)

    # 2, Create application_status_history table
    op.create_table(
        'application_status_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('application_id', sa.String(length=20), sa.ForeignKey('applications.application_id', ondelete='CASCADE'), nullable=False),
        sa.Column('old_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('changed_by', sa.String(length=100), nullable=False, server_default='applicant'),
        sa.Column('vote', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_application_status_history_application_id', 'application_status_history', ['application_id'])
    op.create_index('ix_application_status_history_created_at', 'application_status_history', ['created_at'])
    op.create_index('ix_app_status_history_app_created', 'application_status_history', ['application_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_app_status_history_app_created', table_name='application_status_history')
    op.drop_index('ix_application_status_history_created_at', table_name='application_status_history')
    op.drop_index('ix_application_status_history_application_id', table_name='application_status_history')
    op.drop_table('application_status_history')
    op.drop_column('applications', 'created_at')
    op.drop_column('applications', 'notes')
    op.drop_column('applications', 'partner_id')
