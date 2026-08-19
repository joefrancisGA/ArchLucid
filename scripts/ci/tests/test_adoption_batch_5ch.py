"""TB-258 / TB-259 time-to-value drift guards (Batch 5CH)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5CH(unittest.TestCase):
    def test_tb_258_preseed_failure_cap(self) -> None:
        migration = (
            REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "242_TrialArchitecturePreseedAttemptTracking.sql"
        )
        executor = REPO_ROOT / "ArchLucid.Application" / "TrialArchitecturePreseedExecutor.cs"
        repo_dir = REPO_ROOT / "ArchLucid.Persistence" / "Tenancy"
        audit_dir = REPO_ROOT / "ArchLucid.Core" / "Audit"

        self.assertIn("TrialArchitecturePreseedAttemptCount", migration.read_text(encoding="utf-8"))
        executor_text = executor.read_text(encoding="utf-8")
        self.assertIn("IncrementTrialArchitecturePreseedAttemptAsync", executor_text)
        audit_text = "\n".join(
            path.read_text(encoding="utf-8") for path in sorted(audit_dir.glob("AuditEventTypes*.cs"))
        )
        self.assertIn("TrialArchitecturePreseedFailed", audit_text)

        repo_text = "\n".join(
            path.read_text(encoding="utf-8") for path in sorted(repo_dir.glob("DapperTenantRepository*.cs"))
        )
        self.assertIn("TrialArchitecturePreseedAttemptCount < 5", repo_text)

    def test_tb_259_preseed_tests(self) -> None:
        app_tests = REPO_ROOT / "ArchLucid.Application.Tests" / "TrialArchitecturePreseedExecutorTests.cs"
        host_tests = (
            REPO_ROOT / "ArchLucid.Host.Core.Tests" / "Hosted" / "TrialArchitecturePreseedHostedServiceTests.cs"
        )
        self.assertTrue(app_tests.is_file())
        self.assertTrue(host_tests.is_file())


if __name__ == "__main__":
    unittest.main()
