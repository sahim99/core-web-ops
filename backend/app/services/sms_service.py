"""
SMS Service — Phase 4 Factory.
Returns the correct SMSProvider based on settings.SMS_PROVIDER.
"""

from app.services.interfaces.sms_provider import SMSProvider
from app.core.config import settings


def get_sms_provider() -> SMSProvider:
    """Factory: return configured SMS provider instance."""
    if settings.SMS_PROVIDER == "twilio":
        from app.services.providers.twilio_sms import TwilioSMSProvider
        return TwilioSMSProvider()
    # Default: mock (safe for dev/testing)
    from app.services.providers.mock_sms import MockSMSProvider
    return MockSMSProvider()
