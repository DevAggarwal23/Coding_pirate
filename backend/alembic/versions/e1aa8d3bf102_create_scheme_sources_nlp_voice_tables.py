"""create_scheme_sources_nlp_voice_tables

Revision ID: e1aa8d3bf102
Revises: d9bb7c2ef401
Create Date: 2026-09-12 04:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'e1aa8d3bf102'
down_revision: Union[str, Sequence[str], None] = 'd9bb7c2ef401'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create scheme_sources table
    op.create_table(
        'scheme_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('scheme_id', sa.String(length=100), sa.ForeignKey('schemes.scheme_id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('source_name', sa.String(length=200), nullable=True),
        sa.Column('source_organization', sa.String(length=200), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='OFFICIAL_GOVERNMENT'),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='VERIFIED'),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('last_checked_at', sa.DateTime(), nullable=True),
        sa.Column('data_version', sa.String(length=50), nullable=True, server_default='1.0'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_scheme_sources_scheme_id', 'scheme_sources', ['scheme_id'])
    op.create_index('ix_scheme_sources_verification_status', 'scheme_sources', ['verification_status'])

    # 2. Create nlp_extractions table
    op.create_table(
        'nlp_extractions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.profile_id', ondelete='SET NULL'), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('input_type', sa.String(length=50), nullable=False, server_default='text'),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='hi'),
        sa.Column('intent', sa.String(length=100), nullable=True, server_default='financial_assistance'),
        sa.Column('extracted_entities', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('missing_fields', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('extraction_status', sa.String(length=50), nullable=False, server_default='COMPLETED'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_nlp_extractions_user_id', 'nlp_extractions', ['user_id'])
    op.create_index('ix_nlp_extractions_session_id', 'nlp_extractions', ['session_id'])
    op.create_index('ix_nlp_extractions_created_at', 'nlp_extractions', ['created_at'])

    # 3. Create voice_sessions table
    op.create_table(
        'voice_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.profile_id', ondelete='SET NULL'), nullable=True),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='hi'),
        sa.Column('input_format', sa.String(length=50), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('transcription_confidence', sa.Float(), nullable=True),
        sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='CREATED'),
        sa.Column('provider', sa.String(length=100), nullable=False, server_default='bhashini_asr'),
        sa.Column('error_code', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_voice_sessions_session_id', 'voice_sessions', ['session_id'])
    op.create_index('ix_voice_sessions_user_id', 'voice_sessions', ['user_id'])
    op.create_index('ix_voice_sessions_processing_status', 'voice_sessions', ['processing_status'])
    op.create_index('ix_voice_sessions_created_at', 'voice_sessions', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_voice_sessions_created_at', table_name='voice_sessions')
    op.drop_index('ix_voice_sessions_processing_status', table_name='voice_sessions')
    op.drop_index('ix_voice_sessions_user_id', table_name='voice_sessions')
    op.drop_index('ix_voice_sessions_session_id', table_name='voice_sessions')
    op.drop_table('voice_sessions')

    op.drop_index('ix_nlp_extractions_created_at', table_name='nlp_extractions')
    op.drop_index('ix_nlp_extractions_session_id', table_name='nlp_extractions')
    op.drop_index('ix_nlp_extractions_user_id', table_name='nlp_extractions')
    op.drop_table('nlp_extractions')

    op.drop_index('ix_scheme_sources_verification_status', table_name='scheme_sources')
    op.drop_index('ix_scheme_sources_scheme_id', table_name='scheme_sources')
    op.drop_table('scheme_sources')
