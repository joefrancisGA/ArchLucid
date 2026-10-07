"""Tests for private-beta funnel reporting."""

from __future__ import annotations

import unittest

import sys
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import report_private_beta_funnel as sut


class TestPrivateBetaFunnel(unittest.TestCase):
    def test_builds_complete_funnel_for_a_tenant(self) -> None:
        records = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "RunExported", "runId": "run-1"},
        ]

        report = sut.build_report(records)

        self.assertEqual(report["tenantCount"], 1)
        self.assertEqual(report["completeTenantCount"], 1)

    def test_reports_missing_milestones(self) -> None:
        report = sut.build_report(
            [{"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"}],
        )

        tenant = report["tenants"][0]

        self.assertFalse(tenant["complete"])
        self.assertIn("exported", tenant["missingMilestones"])


if __name__ == "__main__":
    unittest.main()
