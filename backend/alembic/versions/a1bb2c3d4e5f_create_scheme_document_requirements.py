"""create_scheme_document_requirements

Revision ID: a1bb2c3d4e5f
Revises: e1aa8d3bf102
Create Date: 2026-09-12 04:30:00.000000

"""
import sqlalchemy as sa
from alembic import op
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'a1bb2c3d4e5f'
down_revision: Union[str, Sequence[str], None] = 'e1aa8d3bf102'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'scheme_document_requirements',
        sa.Column('id', sa.String(length=100), primary_key=True, nullable=False),
        sa.Column('scheme_id', sa.String(length=100), sa.ForeignKey('schemes.scheme_id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('why_required', sa.Text(), nullable=False),
        sa.Column('mandatory', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('accepted_formats', sa.String(length=255), nullable=True, server_default='pdf,jpg,jpeg,png,webp'),
        sa.Column('max_file_size_mb', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('source', sa.String(length=255), nullable=False, server_default='official_guidelines'),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='VERIFIED'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_scheme_doc_reqs_scheme_id', 'scheme_document_requirements', ['scheme_id'])
    op.create_index('ix_scheme_doc_reqs_doc_type', 'scheme_document_requirements', ['document_type'])


def downgrade() -> None:
    op.drop_index('ix_scheme_doc_reqs_doc_type', table_name='scheme_document_requirements')
    op.drop_index('ix_scheme_doc_reqs_scheme_id', table_name='scheme_document_requirements')
    op.drop_table('scheme_document_requirements')
