"""
SMS Provider Interface — Phase 4.
Abstract contract for all SMS providers (Mock, Twilio, AWS SNS, etc.).
"""

from abc import ABC, abstractmethod


class SMSProvider(ABC):

    @abstractmethod
    async def send(self, to: str, message: str) -> bool:
        """Send an SMS. Returns True if successful."""
        pass

    @abstractmethod
    async def health(self) -> bool:
        """Check provider connectivity/availability."""
        pass
