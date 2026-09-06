using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-36 architecture create/review robustness suggestions 417–428.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave36ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion417_418_export_record_compare_lifecycle_fail_closed()
    {
        string replayService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ComparisonReplayService.cs"));
        string compareFacade = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportQueryFacade.cs"));

        replayService.Should().Contain("AuthorityLifecycleCompareExportGuard");
        replayService.Should().Contain("RegenerateExportDiffAsync");
        compareFacade.Should().Contain("AuthorityLifecycleCompareExportGuard");
        compareFacade.Should().Contain("CompareExportRecordsAsync");
    }

    [Fact]
    public void Suggestion419_420_one_pager_execution_mode_and_career_honesty()
    {
        string factory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Exports",
                "ArchitectureReviewBoard",
                "RunSummaryOnePagerDocumentFactory.cs"));
        string exportService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "RunSummaryOnePagerExportService.cs"));

        factory.Should().Contain("BoardExportExecutionModeNoticeResolver");
        exportService.Should().Contain("CareerExportCoverageHonestyMaterialLoader");
        exportService.Should().Contain("CareerExportCoverageHonestyComposer");
    }

    [Fact]
    public void Suggestion421_422_package_print_route_and_sponsor_sharing_ui_fail_closed()
    {
        string printClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintPageClient.tsx"));
        string sponsorPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureSponsorSharingPanel.tsx"));

        printClient.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        sponsorPanel.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion423_424_cloud_resource_hub_snapshot_guard_and_409()
    {
        string hubService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "CloudResourceEvidenceHubService.cs"));
        string hubController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "CloudResourceEvidenceHubController.cs"));

        hubService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        hubController.Should().Contain("ConflictException");
        hubController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion425_426_infra_evidence_ask_snapshot_guard_and_409()
    {
        string askGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "InfraEvidenceAskSealedManifestHashGuard.cs"));
        string askService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "InfraEvidenceAskGroundingService.cs"));
        string askController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "InfraEvidenceAskController.cs"));

        askGuard.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        askService.Should().Contain("ConflictException");
        askController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion427_428_muted_top_findings_and_drift_report_fail_closed()
    {
        string onePagerFactory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Exports",
                "ArchitectureReviewBoard",
                "RunSummaryOnePagerDocumentFactory.cs"));
        string driftService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "AzureInventoryDriftClassificationService.cs"));
        string inventoryController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "InfraEvidenceInventoryController.cs"));

        onePagerFactory.Should().Contain("IsMuted");
        driftService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        inventoryController.Should().Contain("GetDriftReport");
        inventoryController.Should().Contain("ConflictProblem");
    }
}
