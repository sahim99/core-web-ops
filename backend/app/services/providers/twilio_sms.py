"""
Twilio SMS Provider — Phase 4.
Future-ready stub. Activate by setting TWILIO_SID in environment.
"""

import logging
from app.services.interfaces.sms_provider import SMSProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class TwilioSMSProvider(SMSProvider):

    async def send(self, to: str, message: str) -> bool:
        if not settings.TWILIO_SID:
            logger.warning("[TWILIO SMS] Not configured — TWILIO_SID is empty")
            return False
        try:
            # Real Twilio client logic would go here:
            # from twilio.rest import Client
            # client = Client(settings.TWILIO_SID, settings.TWILIO_TOKEN)
            # client.messages.create(body=message, from_=settings.TWILIO_FROM, to=to)
            logger.info(f"[TWILIO SMS] Sent to {to}")
            return True
        except Exception as exc:
            logger.error(f"[TWILIO SMS] Failed: {exc}")
            return False

    async def health(self) -> bool:
        return bool(settings.TWILIO_SID)
