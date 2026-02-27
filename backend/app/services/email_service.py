"""
Email Service — sends notifications to workspace owners.
Uses SMTP provider when configured, falls back to mock for dev/testing.
"""

import logging
from app.services.interfaces.email_provider import EmailProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_email_provider() -> EmailProvider:
    """Factory: return configured email provider instance."""
    if settings.EMAIL_PROVIDER == "smtp":
        from app.services.providers.smtp_email import SMTPEmailProvider
        return SMTPEmailProvider()
    # Default: mock (safe for dev/testing)
    from app.services.providers.mock_email import MockEmailProvider
    return MockEmailProvider()


# ── Owner Signup Email ──────────────────────────────────────

async def send_owner_signup_email(owner):
    """
    Sends a welcome email to the workspace owner on signup.
    Safe: never raises — logs errors silently.
    """
    try:
        provider = get_email_provider()
        subject = "🎉 Welcome to CoreWebOps"

        body = f"""Hi {owner.full_name},

Congratulations! 🎉

You have successfully created your CoreWebOps workspace.

Your operational command center is now live and ready to help you manage bookings, contacts, automation, and inventory — all in one place.

You can now:
• Add team members
• Configure bookings
• Manage inbox & forms
• Track inventory

If you need assistance, our support team is always here to help.

Welcome aboard,
The CoreWebOps Team
"""
        result = await provider.send(owner.email, subject, body)
        if result:
            logger.info(f"[EMAIL] Signup welcome sent to {owner.email}")
        else:
            logger.warning(f"[EMAIL] Signup welcome failed for {owner.email}")
    except Exception as e:
        logger.error(f"[EMAIL] Signup email error for {owner.email}: {e}")


# ── Owner Login Email ───────────────────────────────────────

async def send_owner_login_email(owner):
    """
    Sends a login confirmation email to the workspace owner.
    Safe: never raises — logs errors silently.
    """
    try:
        provider = get_email_provider()
        subject = "🔐 Login Successful – CoreWebOps"

        body = f"""Hi {owner.full_name},

This is a confirmation that you have successfully logged into your CoreWebOps workspace.

If this wasn't you, please reset your password immediately.

Stay secure,
The CoreWebOps Team
"""
        result = await provider.send(owner.email, subject, body)
        if result:
            logger.info(f"[EMAIL] Login notification sent to {owner.email}")
        else:
            logger.warning(f"[EMAIL] Login notification failed for {owner.email}")
    except Exception as e:
        logger.error(f"[EMAIL] Login email error for {owner.email}: {e}")


# ── Legacy: workspace activation email (kept for backward compat) ──

async def send_workspace_welcome_email(owner):
    """Alias for signup email — used by onboarding activation."""
    await send_owner_signup_email(owner)
