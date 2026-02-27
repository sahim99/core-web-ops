"""
Mock Email Provider — Phase 4.
Safe default for local development and testing.
"""

import logging
from app.services.interfaces.email_provider import EmailProvider

logger = logging.getLogger(__name__)


class MockEmailProvider(EmailProvider):

    async def send(self, to: str, subject: str, body: str) -> bool:
        logger.info(f"[MOCK EMAIL] To={to}, Subject={subject}")
        return True

    async def health(self) -> bool:
        return True
