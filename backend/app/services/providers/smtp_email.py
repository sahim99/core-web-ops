"""
SMTP Email Provider — Phase 4.
Production-grade email delivery via SMTP_SSL.
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.services.interfaces.email_provider import EmailProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class SMTPEmailProvider(EmailProvider):

    async def send(self, to: str, subject: str, body: str) -> bool:
        try:
            msg = MIMEMultipart()
            sender = settings.SMTP_FROM or settings.SMTP_USER
            msg["From"] = sender
            msg["To"] = to
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, to, msg.as_string())

            logger.info(f"[SMTP EMAIL] Sent to {to}: {subject}")
            return True
        except Exception as exc:
            logger.error(f"[SMTP EMAIL] Failed to send to {to}: {exc}")
            return False

    async def health(self) -> bool:
        try:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
                server.noop()
            return True
        except Exception:
            return False
