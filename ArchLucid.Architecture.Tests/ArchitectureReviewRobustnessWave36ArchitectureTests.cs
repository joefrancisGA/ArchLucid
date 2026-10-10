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
        string replayService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/ComparisonReplayService.cs");
        string compareFacade = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/RunExportQueryFacade.cs");

        replayService.Should().Contain("AuthorityLifecycleCompareExportGuard");
        replayService.Should().Contain("RegenerateExportDiffAsync");
        compareFacade.Should().Contain("AuthorityLifecycleCompareExportGuard");
        compareFacade.Should().Contain("CompareExportRecordsAsync");
    }

    [Fact]
    public void Suggestion419_420_one_pager_execution_mode_and_career_honesty()
    {
        string factory = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/ArchitectureReviewBoard/RunSummaryOnePagerDocumentFactory.cs");
        string exportService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/RunSummaryOnePagerExportService.cs");

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
        string hubService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/CloudResourceEvidenceHubService.cs");
        string hubController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/CloudResourceEvidenceHubController.cs");

        hubService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        hubController.Should().Contain("ConflictException");
        hubController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion425_426_infra_evidence_ask_snapshot_guard_and_409()
    {
        string askGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/InfraEvidenceAskSealedManifestHashGuard.cs");
        string askService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs");
        string askController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceAskController.cs");

        askGuard.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        askService.Should().Contain("ConflictException");
        askController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion427_428_muted_top_findings_and_drift_report_fail_closed()
    {
        string onePagerFactory = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/ArchitectureReviewBoard/RunSummaryOnePagerDocumentFactory.cs");
        string driftService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/AzureInventoryDriftClassificationService.cs");
        string inventoryController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceInventoryController.cs");

        onePagerFactory.Should().Contain("IsMuted");
        driftService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        inventoryController.Should().Contain("GetDriftReport");
        inventoryController.Should().Contain("ConflictProblem");
    }
}
