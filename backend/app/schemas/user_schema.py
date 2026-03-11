from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "FileForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    OUTPUT_DIR: Path = BASE_DIR / "storage" / "outputs"
    TEMP_DIR: Path = BASE_DIR / "storage" / "temp"

    MAX_FILE_SIZE_MB: int = 100
    MAX_BATCH_FILES: int = 20

    DATABASE_URL: str = "sqlite:///./fileforge.db"

    SECRET_KEY: str = "fileforge-secret-key"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()