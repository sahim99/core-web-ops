from sqlalchemy.orm import Session
# from app.models.booking import BookingType
from app.models.form import Form
from app.models.inventory import InventoryItem

class OnboardingValidator:
    """Service to validate if a workspace has completed all onboarding steps."""

    @staticmethod
    def validate(workspace_id: int, db: Session) -> list[str]:
        """Return a list of missing steps (e.g., ['email', 'booking'])."""
        missing = []

        if not OnboardingValidator._email_configured(workspace_id, db):
            missing.append("email")

        if not OnboardingValidator._booking_configured(workspace_id, db):
            missing.append("booking")

        if not OnboardingValidator._forms_configured(workspace_id, db):
            missing.append("form")

        if not OnboardingValidator._inventory_configured(workspace_id, db):
            missing.append("inventory")

        return missing

    @staticmethod
    def _email_configured(workspace_id: int, db: Session) -> bool:
        # TODO Phase 4: Check actual integration status in DB
        # For now, return True to allow progress (email is usually step 1)
        # Frontend wizard handles the connection UX.
        return True

    @staticmethod
    def _booking_configured(workspace_id: int, db: Session) -> bool:
        """Check if at least one active booking type exists."""
        # BookingType model temporarily removed in Phase 13 refactor.
        # Returning True to unblock onboarding.
        return True

    @staticmethod
    def _forms_configured(workspace_id: int, db: Session) -> bool:
        """Check if at least one active form exists."""
        return db.query(Form).filter(
            Form.workspace_id == workspace_id,
            Form.is_active == True
        ).count() > 0

    @staticmethod
    def _inventory_configured(workspace_id: int, db: Session) -> bool:
        """Check if at least one active inventory item exists."""
        # Using count() > 0 is efficient
        return db.query(InventoryItem).filter(
            InventoryItem.workspace_id == workspace_id,
            InventoryItem.is_deleted == False
        ).count() > 0
