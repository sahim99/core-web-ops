"""
Application configuration – all values from environment variables.
No hardcoded secrets or database URLs.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ────────────────────────────────────────────
    DATABASE_URL: str

    # ── JWT / Auth ──────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── CORS ────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # ── Server ──────────────────────────────────────────────
    PORT: int = int(os.environ.get("PORT", 8000))

    # ── App ─────────────────────────────────────────────────
    APP_NAME: str = "Core Web Ops"
    DEBUG: bool = False

    # ── Integration Providers (Phase 4) ─────────────────────
    EMAIL_PROVIDER: str = "mock"       # "mock" | "smtp"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_USE_SSL: bool = True

    SMS_PROVIDER: str = "mock"         # "mock" | "twilio"
    TWILIO_SID: str = ""
    TWILIO_TOKEN: str = ""
    TWILIO_FROM: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
