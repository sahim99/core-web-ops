"""
Email Provider Interface — Phase 4.
Abstract contract for all email providers (Mock, SMTP, SendGrid, etc.).
"""

from abc import ABC, abstractmethod


class EmailProvider(ABC):

    @abstractmethod
    async def send(self, to: str, subject: str, body: str) -> bool:
        """Send an email. Returns True if successful."""
        pass

    @abstractmethod
    async def health(self) -> bool:
        """Check provider connectivity/availability."""
        pass
