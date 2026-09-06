using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-34 architecture create/review robustness suggestions 392–404.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave34ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion392_394_audit_architecture_evidence_fail_closed_on_sealed_hash()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "AuditEvidence",
                "AuditArchitectureEvidenceSealedManifestHashGuard.cs"));
        string exportService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "AuditEvidence",
                "AuditEvidencePackageExportService.cs"));
        string hybridService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "AuditEvidence",
                "AuditHybridEvidenceQueryService.cs"));
        string lineageService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "AuditEvidence",
                "AuditEvidenceLineageService.cs"));

        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        exportService.Should().Contain("AuditArchitectureEvidenceSealedManifestHashGuard");
        hybridService.Should().Contain("AuditArchitectureEvidenceSealedManifestHashGuard");
        lineageService.Should().Contain("AuditArchitectureEvidenceSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion395_396_snapshot_export_fail_closed_when_run_cited()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "Mermaid",
                "InfraEvidenceSnapshotSealedManifestHashGuard.cs"));
        string mermaidService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "Mermaid",
                "InfraEvidenceSnapshotMermaidService.cs"));
        string terraformService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "AdvisoryTerraformRepresentationService.cs"));

        guard.Should().Contain("ListRunIdsBySnapshotAsync");
        mermaidService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        terraformService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion397_diagram_model_get_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "StructuredDiagramIngestService.cs"));
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramIngestController.cs"));

        service.Should().Contain("StructuredDiagramIngestSealedManifestHashGuard");
        controller.Should().Contain("ConflictException");
        controller.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion398_post_commit_projection_outbox_fail_closed_on_sealed_hash()
    {
        string processor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Coordination",
                "Projection",
                "PostCommitProjectionOutboxProcessor.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Coordination",
                "PostCommitProjectionOutboxSealedManifestHashGuard.cs"));

        processor.Should().Contain("PostCommitProjectionOutboxSealedManifestHashGuard");
        guard.Should().Contain("RunExportBlobPushSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion399_traceability_bundle_maps_conflict_to_409()
    {
        string runQuery = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Findings.cs"));
        string authorityReads = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReadsController.cs"));

        runQuery.Should().Contain("ConflictException");
        runQuery.Should().Contain("ConflictProblem");
        authorityReads.Should().Contain("ConflictException");
        authorityReads.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion400_async_docx_enqueue_fail_closed_on_sealed_hash()
    {
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.AnalyzeExport.cs"));

        controller.Should().Contain("ArchitectureAnalysisSealedManifestHashGuard");
        controller.Should().Contain("DownloadAnalysisReportDocxAsync");
        controller.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion401_402_share_and_print_ui_fail_closed()
    {
        string shareButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ShareReviewPackageButton.tsx"));
        string printOpen = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "PackagePrintOpenButton.tsx"));
        string printButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "PackagePrintButton.tsx"));

        shareButton.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        printOpen.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        printButton.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion403_e2e_compare_maps_conflict_to_409()
    {
        string replayController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.Replay.cs"));
        string comparisonService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "EndToEndReplayComparisonService.cs"));

        replayController.Should().Contain("ConflictException");
        replayController.Should().Contain("ConflictProblem");
        comparisonService.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion404_data_consistency_outbox_skips_hash_when_no_run_id()
    {
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));

        outboxGuard.Should().Contain("IntegrationEventTypes.DataConsistencyCheckCompletedV1");
    }
}
