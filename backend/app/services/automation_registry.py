"""
Automation Rules Registry.
Central definition of all business automation rules for visibility and documentation.
"""

class AutomationRule:
    def __init__(self, key: str, trigger: str, description: str):
        self.key = key
        self.trigger = trigger
        self.description = description

    def dict(self):
        return {
            "key": self.key,
            "trigger": self.trigger,
            "description": self.description
        }


# Define all system automations here
AUTOMATION_RULES = [
    AutomationRule(
        key="booking_confirmation",
        trigger="booking.confirmed",
        description="Send confirmation email and system notification when booking is confirmed",
    ),
    AutomationRule(
        key="new_contact_welcome",
        trigger="contact.created",
        description="Send welcome email to new contact",
    ),
    AutomationRule(
        key="booking_cancellation",
        trigger="booking.cancelled",
        description="Send cancellation email and update thread when booking is cancelled",
    ),
    AutomationRule(
        key="form_notification",
        trigger="form.submitted",
        description="Notify staff of new form submission via email and inbox",
    ),
    AutomationRule(
        key="inventory_low_alert",
        trigger="inventory.low_stock",
        description="Create critical alert and notify staff when stock falls below threshold",
    ),
]

def get_rule_by_trigger(trigger: str) -> list[AutomationRule]:
    """Return all rules listening to a specific trigger."""
    return [r for r in AUTOMATION_RULES if r.trigger == trigger]
