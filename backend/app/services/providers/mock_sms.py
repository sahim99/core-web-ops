"""
Mock SMS Provider — Phase 4.
Safe default for local development and testing.
"""

import logging
from app.services.interfaces.sms_provider import SMSProvider

logger = logging.getLogger(__name__)


class MockSMSProvider(SMSProvider):

    async def send(self, to: str, message: str) -> bool:
        logger.info(f"[MOCK SMS] To={to}, Message={message[:80]}")
        return True

    async def health(self) -> bool:
        return True
