"""TB-261 / TB-262 stickiness drift guards (Batch 5CI)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestStickinessBatch5CI(unittest.TestCase):
    def test_tb_262_schedule_health_columns(self) -> None:
        contract = REPO_ROOT / "ArchLucid.Contracts" / "Governance" / "ArchitectureReviewRecurrenceSchedule.cs"
        text = contract.read_text(encoding="utf-8")
        self.assertIn("LastRunStatus", text)
        self.assertIn("ConsecutiveFailureCount", text)

    def test_tb_261_recurrence_notification_service(self) -> None:
        trigger = REPO_ROOT / "ArchLucid.Application" / "Governance" / "RecurringArchitectureReviewTriggerService.cs"
        options = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "RecurrenceCompletionNotificationOptions.cs"
        self.assertIn("IRecurrenceCompletionNotificationService", trigger.read_text(encoding="utf-8"))
        self.assertIn("RecurrenceCompletionNotification", options.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
