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

    def test_unrelated_runs_cannot_complete_same_tenant_funnel(self) -> None:
        records = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized", "runId": "run-2"},
            {"tenantId": "tenant-a", "eventType": "RunExported", "runId": "run-1"},
        ]
        report = sut.build_report(records)
        self.assertEqual(report["completeTenantCount"], 0)
        self.assertIn("coherentRunProof", report["tenants"][0]["missingMilestones"])

    def test_unknown_run_ids_do_not_count_as_complete_proof(self) -> None:
        records = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated"},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized"},
            {"tenantId": "tenant-a", "eventType": "RunExported"},
        ]
        report = sut.build_report(records)
        self.assertFalse(report["tenants"][0]["complete"])

    def test_later_incomplete_run_does_not_erase_completed_run(self) -> None:
        events = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "RunExported", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": "run-2"},
        ]
        result = sut.build_report(events)
        self.assertEqual(result["completeTenantCount"], 1)
        self.assertEqual(result["tenants"][0]["completeRunIds"], ["run-1"])

    def test_unrelated_run_milestones_never_assemble_into_complete_run(self) -> None:
        events = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized", "runId": "run-2"},
            {"tenantId": "tenant-a", "eventType": "RunExported", "runId": "run-3"},
        ]
        result = sut.build_report(events)
        self.assertEqual(result["completeTenantCount"], 0)
        self.assertEqual(result["tenants"][0]["completeRunIds"], [])

    def test_untrusted_tenant_identifier_cannot_break_markdown_table(self) -> None:
        records = [{
            "tenantId": "tenant|other\n| forged | row <script>x</script>",
            "eventType": "Admin.UserInvitationCreated",
        }]
        output = sut.render_markdown(sut.build_report(records))
        self.assertEqual(len([line for line in output.splitlines() if line.startswith("|")]), 3)
        self.assertIn("tenant\\|other", output)
        self.assertNotIn("<script>", output)
        self.assertNotIn("| forged | row", output)

    def test_markdown_escape_special_characters(self) -> None:
        cleaned = sut._markdown_table_cell("a|b\r\nc<em>\t`")
        self.assertNotIn("<em>", cleaned)
        self.assertNotIn("\n", cleaned)
        self.assertIn("&lt;em&gt;", cleaned)

    def test_malformed_tenant_identifiers_do_not_create_funnel_tenants(self) -> None:
        invalid = (None, 1, True, False, [], {}, ["tenant-a"],
                   {"tenantId": "tenant-a"}, "", " ", "null", "none", "UNKNOWN")
        records = [{"tenantId": tenant, "eventType": "Admin.UserInvitationCreated"}
                   for tenant in invalid]
        report = sut.build_report(records)
        self.assertEqual(report["tenantCount"], 0)
        self.assertEqual(report["completeTenantCount"], 0)

    def test_malformed_event_types_are_not_counted(self) -> None:
        invalid = (None, 1, True, False, [], {}, ["Admin.UserInvitationCreated"])
        records = [{"tenantId": "tenant-a", "eventType": event}
                   for event in invalid]
        report = sut.build_report(records)
        self.assertEqual(report["tenantCount"], 0)

    def test_run_identity_whitespace_is_normalized_before_coherence(self) -> None:
        records = [
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"},
            {"tenantId": "tenant-a", "eventType": "Admin.UserInvitationAccepted"},
            {"tenantId": "tenant-a", "eventType": "Architecture.RunCreated", "runId": " run-1 "},
            {"tenantId": "tenant-a", "eventType": "ManifestFinalized", "runId": "run-1"},
            {"tenantId": "tenant-a", "eventType": "RunExported", "runId": "run-1"},
        ]
        report = sut.build_report(records)
        self.assertEqual(report["completeTenantCount"], 1)
        self.assertEqual(report["tenants"][0]["completeRunIds"], ["run-1"])

    def test_reports_missing_milestones(self) -> None:
        report = sut.build_report(
            [{"tenantId": "tenant-a", "eventType": "Admin.UserInvitationCreated"}],
        )

        tenant = report["tenants"][0]

        self.assertFalse(tenant["complete"])
        self.assertIn("exported", tenant["missingMilestones"])


if __name__ == "__main__":
    unittest.main()
