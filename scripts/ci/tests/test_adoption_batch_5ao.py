"""TB-222 recurrence scheduling UI drift guards (Batch 5AO)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AO(unittest.TestCase):
    def test_tb_222_put_recurrence_schedule_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernanceStickinessController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('HttpPut("recurrence-schedules/{scheduleId:guid}")', text)
        self.assertIn("UpdateRecurrenceSchedule", text)

    def test_tb_222_post_commit_card(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "RecurrenceSchedulePostCommitCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("recurrence-schedule-post-commit-card", text)
        self.assertIn("createArchitectureReviewRecurrenceSchedule", text)

    def test_tb_222_management_page(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "RecurrenceSchedulesClient.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("updateArchitectureReviewRecurrenceSchedule", text)
        self.assertIn("EnterpriseTable", text)

    def test_tb_222_nav_link(self) -> None:
        # Recurrence schedules live in the Pilot nav group only (nav-config.structure forbids duplicate hrefs).
        operate_path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operate-governance-nav-group-builder.ts"
        operate_text = operate_path.read_text(encoding="utf-8")
        self.assertNotIn("/governance/recurrence-schedules", operate_text)

    def test_tb_222_pilot_nav_link(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "pilot-nav-group-builder.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/governance/recurrence-schedules", text)
        self.assertIn("recurrenceSchedules", text)


if __name__ == "__main__":
    unittest.main()
