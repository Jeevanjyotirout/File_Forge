from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    APP_NAME: str = "FileForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    TEMP_DIR: str = "temp"

    # File size limits
    MAX_FILE_SIZE_MB: int = 100
    MAX_BATCH_FILES: int = 20

    # Database
    DATABASE_URL: str = "sqlite:///./fileforge.db"

    # JWT
    SECRET_KEY: str = "fileforge-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # AI (Anthropic)
    ANTHROPIC_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure required directories exist
for directory in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR]:
    os.makedirs(directory, exist_ok=True)
