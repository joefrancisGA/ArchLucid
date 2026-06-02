"""TB-207 token-claims diagnostic drift guards (Batch 5X)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5X(unittest.TestCase):
    def test_tb_207_diagnose_token_endpoint_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "AdminAuthDiagnosticsController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("auth/diagnose-token", text)
        self.assertIn("ITokenClaimsDiagnosticService", text)
        self.assertIn("AuthTokenDiagnosticRequested", text)

    def test_tb_207_token_claims_diagnostic_service_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Services" / "Admin" / "TokenClaimsDiagnosticService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ArchLucidRoleClaimsTransformation", text)
        self.assertIn("ResolvedRoles", text)
        self.assertIn("UnmappedValues", text)

    def test_tb_207_cli_test_token_command_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "AuthTestTokenCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("auth/diagnose-token", text)
        self.assertIn("--bearer", text)

    def test_tb_207_audit_event_catalog_entry(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Audit" / "AuditEventTypes.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AuthTokenDiagnosticRequested", text)


if __name__ == "__main__":
    unittest.main()
