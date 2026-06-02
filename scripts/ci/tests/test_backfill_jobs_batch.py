"""TB-085–090 backfill and container-job operational hardening drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestBackfillJobsBatch(unittest.TestCase):
    def test_backfill_checkpoint_migration_exists(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "234_BackfillCheckpoints_BackfillFailures.sql"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("BackfillCheckpoints", text)
        self.assertIn("BackfillFailures", text)

    def test_backfill_cli_parses_batch_and_retry_flags(self) -> None:
        path = REPO_ROOT / "ArchLucid.Backfill.Cli" / "Program.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("--batch-size", text)
        self.assertIn("--max-retries", text)
        self.assertIn("--force-retry", text)

    def test_trial_lifecycle_job_isolates_per_tenant_failures(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core" / "Jobs" / "TrialLifecycleArchLucidJob.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("TryAdvanceTenantAsync", text)
        self.assertIn("FailureCount", text)

    def test_digest_dispatchers_reserve_ledger_before_send(self) -> None:
        for relative in (
            "ArchLucid.Application/Notifications/Email/ExecDigestEmailDispatcher.cs",
            "ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs",
        ):
            text = (REPO_ROOT / relative).read_text(encoding="utf-8")
            ledger_index = text.index("TryRecordSentAsync")
            send_index = text.index("SendAsync")
            self.assertLess(ledger_index, send_index, relative)


if __name__ == "__main__":
    unittest.main()
