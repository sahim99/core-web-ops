import unittest
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session
from app.services.event_dispatcher import dispatch_event, EVENT_HANDLERS
from app.utils.enums import AutomationEventType
from app.models.automation_log import AutomationLog

class TestEventDispatcher(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)
        self.workspace_id = 1
        self.reference_id = 100

    @patch("app.services.event_dispatcher.EVENT_HANDLERS")
    def test_dispatch_event_success(self, mock_handlers):
        # Setup mock handler
        mock_handler = MagicMock()
        mock_handlers.get.return_value = mock_handler

        # Call dispatch
        event_type = AutomationEventType.FORM_SUBMITTED.value
        payload = {"email": "test@example.com"}
        
        log = dispatch_event(
            workspace_id=self.workspace_id,
            event_type=event_type,
            reference_id=self.reference_id,
            db=self.mock_db,
            payload=payload
        )

        # Verify DB interaction
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called()
        self.mock_db.refresh.assert_called()

        # Verify Handler Called
        mock_handler.assert_called_once_with(
            workspace_id=self.workspace_id,
            reference_id=self.reference_id,
            db=self.mock_db,
            payload=payload
        )

        # Verify Log Status
        self.assertEqual(log.status, "success")

    @patch("app.services.event_dispatcher.EVENT_HANDLERS")
    def test_dispatch_event_no_handler(self, mock_handlers):
        # Setup no handler
        mock_handlers.get.return_value = None

        # Call dispatch
        event_type = "unknown_event"
        
        log = dispatch_event(
            workspace_id=self.workspace_id,
            event_type=event_type,
            reference_id=self.reference_id,
            db=self.mock_db
        )

        # Verify Log Status
        self.assertEqual(log.status, "skipped")

    @patch("app.services.event_dispatcher.EVENT_HANDLERS")
    def test_dispatch_event_error(self, mock_handlers):
        # Setup handler that raises exception
        mock_handler = MagicMock(side_effect=Exception("Boom"))
        mock_handlers.get.return_value = mock_handler

        # Call dispatch
        event_type = AutomationEventType.FORM_SUBMITTED.value
        
        log = dispatch_event(
            workspace_id=self.workspace_id,
            event_type=event_type,
            reference_id=self.reference_id,
            db=self.mock_db
        )

        # Verify Log Status
        self.assertEqual(log.status, "error")

if __name__ == "__main__":
    unittest.main()
