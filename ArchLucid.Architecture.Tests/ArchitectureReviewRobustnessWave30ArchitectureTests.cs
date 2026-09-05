using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-30 architecture create/review robustness suggestions (360–370 Tier 1 batch).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave30ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion360_vision_diagram_ingest_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "VisionDiagramIngestService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "VisionDiagramIngestSealedManifestHashGuard.cs"));

        service.Should().Contain("VisionDiagramIngestSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion361_362_outbox_and_publishers_use_committed_manifest_hash()
    {
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));
        string resolver = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integration",
                "RunIntegrationEventManifestHashResolver.cs"));
        string publishing = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "ArchitectureRunIntegrationEventPublishing.cs"));

        outboxGuard.Should().Contain("IntegrationEventTypes.AuthorityRunFailedV1");
        outboxGuard.Should().Contain("IntegrationEventTypes.AuthorityRunQualityGateRejectedV1");
        resolver.Should().Contain("TryResolveVerifiedManifestHashWhenCommittedOrNullAsync");
        publishing.Should().Contain("TryResolveVerifiedManifestHashWhenCommittedOrNullAsync");
    }

    [Fact]
    public void Suggestion363_finding_remediation_assignment_fail_closed_on_sealed_hash()
    {
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.cs"));

        controller.Should().Contain("GovernanceDispositionSealedManifestGuard");
        controller.Should().Contain("PutRemediationAssignmentAsync");
    }

    [Fact]
    public void Suggestion364_run_scoped_audit_export_fail_closed_on_sealed_hash()
    {
        string csvExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "AuditController.Export.Csv.cs"));
        string downloadExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "AuditController.Export.Download.cs"));

        csvExport.Should().Contain("RunExportSealedManifestHashGuard");
        downloadExport.Should().Contain("RunExportSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion365_infra_evidence_ask_fail_closed_when_run_scoped()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "InfraEvidenceAskGroundingService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "InfraEvidenceAskSealedManifestHashGuard.cs"));

        service.Should().Contain("InfraEvidenceAskSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion366_run_scoped_audit_export_ui_fail_closed()
    {
        string button = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunScopedAuditExportButton.tsx"));

        button.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion368_sponsor_handoff_docx_export_ui_fail_closed()
    {
        string strip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "ReviewPackageSponsorHandoffStrip.tsx"));

        strip.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        strip.Should().Contain("review-package-sponsor-handoff-docx-blocked-reason");
    }

    [Fact]
    public void Suggestion370_decision_receipt_export_ui_fail_closed()
    {
        string button = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "draft-intake", "DecisionReceiptExportButton.tsx"));

        button.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }
}
