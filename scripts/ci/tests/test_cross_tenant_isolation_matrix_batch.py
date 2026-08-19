"""TB-078 cross-tenant isolation integration test matrix drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

# V1 matrix — see docs/library/TECH_BACKLOG.md TB-078 and docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md
PERSISTENCE_ISOLATION_TESTS = (
    "SqlFindingsSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlContextSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlGraphSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
)

API_ISOLATION_TESTS = (
    "ScopedSnapshotReadIdorIntegrationTests.cs",
    "ScopeIdentityBindingIntegrationTests.cs",
    "TenantIsolationSmokeTests.cs",
    "AuditExportTenantIsolationIntegrationTests.cs",
)

RETRIEVAL_ISOLATION_TESTS = (
    "RetrievalIndexingScopeValidatorTests.cs",
    "AzureSearchTenantScopeFilterBuilderTests.cs",
)


class TestCrossTenantIsolationMatrixBatch(unittest.TestCase):
    def test_persistence_snapshot_idor_tests_exist(self) -> None:
        root = REPO_ROOT / "ArchLucid.Persistence.Tests"
        for name in PERSISTENCE_ISOLATION_TESTS:
            path = root / name
            self.assertTrue(path.is_file(), f"Missing {path}")

    def test_api_scope_and_idor_tests_exist(self) -> None:
        security_dir = REPO_ROOT / "ArchLucid.Api.Tests" / "Security"
        for name in ("ScopedSnapshotReadIdorIntegrationTests.cs", "ScopeIdentityBindingIntegrationTests.cs"):
            path = security_dir / name
            self.assertTrue(path.is_file(), f"Missing {path}")

        smoke_path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "TenantIsolationSmokeTests.cs"
        self.assertTrue(smoke_path.is_file(), f"Missing {smoke_path}")

    def test_scoped_snapshot_idor_matrix_covers_artifact_export_routes(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/export/push", text, "TB-274 export push IDOR regression")
        self.assertIn("/export", text, "TB-274 run export zip IDOR regression")

    def test_scoped_snapshot_idor_matrix_covers_run_scoped_mutating_routes(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/analysis-report", text, "TB-274 run analysis-report POST IDOR regression")
        self.assertIn("/evidence/bulk", text, "TB-274 run evidence bulk POST IDOR regression")
        self.assertIn("/terraform-pr", text, "TB-274 terraform PR POST IDOR regression")

    def test_alert_digest_controllers_declare_idempotency_posture(self) -> None:
        controllers = (
            "AlertRoutingSubscriptionsController.cs",
            "AlertRulesController.cs",
            "CompositeAlertRulesController.cs",
            "AlertSimulationController.cs",
            "AlertTuningController.cs",
            "AlertsController.cs",
            "DigestSubscriptionsController.cs",
        )
        alerts_dir = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Alerts"
        advisory_dir = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Advisory"

        for name in controllers:
            root = advisory_dir if name == "DigestSubscriptionsController.cs" else alerts_dir
            path = root / name
            text = path.read_text(encoding="utf-8")
            self.assertIn(
                "idempotency-posture:",
                text,
                f"{name} must declare INV-009 posture before mutating routes",
            )

    def test_route_tenant_scope_binding_filter_is_registered(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Startup" / "MvcExtensions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RouteTenantScopeBindingFilter", text)

    def test_policy_pack_tenant_pilot_register_controllers_declare_idempotency_posture(self) -> None:
        controller_paths = (
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "PolicyPacksController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Pilots" / "PilotsController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Pilots" / "PilotsBoardPackController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "RegistrationController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Billing" / "BillingCheckoutController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Tenancy" / "TenantErasureLegalHoldController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Tenancy" / "TenantTrialController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Tenancy" / "TenantWorkspacesController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Tenancy" / "TenantCustomerSuccessController.cs",
        )

        for path in controller_paths:
            text = path.read_text(encoding="utf-8")
            self.assertIn(
                "idempotency-posture:",
                text,
                f"{path.name} must declare INV-009 posture before mutating routes",
            )

    def test_remainder_mutating_controllers_declare_idempotency_posture(self) -> None:
        controller_paths = (
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Authority" / "FastPathContextController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Demo" / "QuickStartController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "DemoController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "ClientErrorTelemetryController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Diagnostics" / "SyntheticOperatorDemoPackController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Evolution" / "EvolutionController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Planning" / "FindingFeedbackController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Findings" / "FindingMuteController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernancePreviewController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Integrations" / "ItsmCorrelationController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Integrations" / "ItsmOutboundIssuesController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Analytics" / "InternalCrossTenantAnalyticsController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Advisory" / "LearningController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Mcp" / "McpRetrievalToolsController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Operator" / "OperatorSavedViewsController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Advisory" / "ProductLearningController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "ValueReports" / "ValueReportController.cs",
        )

        for path in controller_paths:
            text = path.read_text(encoding="utf-8")
            self.assertIn(
                "idempotency-posture:",
                text,
                f"{path.name} must declare INV-009 posture before mutating routes",
            )

    def test_internal_governance_scim_controllers_declare_idempotency_posture(self) -> None:
        controller_paths = (
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Authority" / "InternalArchitectureDiagnosticsController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernanceStickinessController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernancePreCommitSimulationController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Scim" / "ScimUsersController.cs",
            REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Scim" / "ScimGroupsController.cs",
        )

        for path in controller_paths:
            text = path.read_text(encoding="utf-8")
            self.assertIn(
                "idempotency-posture:",
                text,
                f"{path.name} must declare INV-009 posture before mutating routes",
            )

        governance_dir = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance"
        governance_sources = "".join(
            partial.read_text(encoding="utf-8")
            for partial in sorted(governance_dir.glob("GovernanceController*.cs"))
        )
        self.assertIn(
            "idempotency-posture:",
            governance_sources,
            "GovernanceController partials must declare INV-009 posture before mutating routes",
        )

    def test_scoped_snapshot_idor_matrix_covers_ingest_routes(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/azure-extractor/upload", text, "TB-274 extractor upload runId IDOR regression")
        self.assertIn("/azure-extractor/packages/", text, "TB-274 extractor package download IDOR regression")

    def test_retrieval_indexing_and_search_filter_tests_exist(self) -> None:
        root = REPO_ROOT / "ArchLucid.Retrieval.Tests"
        for name in RETRIEVAL_ISOLATION_TESTS:
            path = root / name
            self.assertTrue(path.is_file(), f"Missing {path}")

    def test_scope_identity_binding_middleware_is_wired(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Startup" / "PipelineExtensions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ScopeIdentityBindingMiddleware", text)

    def test_scope_identity_binding_permutation_table_documents_auth_modes(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopeIdentityBindingIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Jwt_with_mismatched_tenant_header_returns_forbidden_tb300", text)
        self.assertIn("DevBypass_with_mismatched_tenant_header_returns_forbidden_tb300", text)
        self.assertIn("ApiKey_without_tenant_claim_rejects_tenant_header_escalation", text)

    def test_tenant_retrieval_boundary_proof_script_exists(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "report_tenant_retrieval_boundary_proof.py"
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
