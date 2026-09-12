from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/scheme_matcher"

    # Bhashini (production voice API)
    bhashini_enabled: bool = False
    bhashini_api_url: str = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    bhashini_user_id: str = ""
    bhashini_ulca_api_key: str = ""
    bhashini_inference_api_key: str = ""
    bhashini_pipeline_id: str = ""
    bhashini_api_key: str = ""

    # Whisper (demo voice)
    whisper_model_size: str = "base"  # tiny | base | small

    # FAISS
    faiss_index_path: str = "data/scheme_vectors.index"

    # AI LLM Keys (Groq / Grok / Gemini)
    groq_api_key: str = ""
    grok_api_key: str = ""
    xai_api_key: str = ""
    gemini_api_key: str = ""

    # Data
    schemes_json_path: str = "data/schemes.json"

    # Security
    secret_key: str = "change-me-in-production-use-secrets-generate"

    # Document Upload & Storage
    upload_dir: str = "uploads/documents"
    max_document_size_mb: int = 20

    # Mappls / MapmyIndia Integration
    mappls_api_key: str = ""
    mappls_client_id: str = ""
    mappls_client_secret: str = ""

    # App
    environment: str = "development"
    port: int = 8000


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
