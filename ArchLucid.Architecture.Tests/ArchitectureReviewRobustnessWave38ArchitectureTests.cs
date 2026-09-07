using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-38 architecture create/review robustness suggestions 441–452.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave38ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion441_443_legacy_authority_compare_lifecycle_and_409()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityCompareController.cs"));

        controller.Should().Contain("ICompareRunsApplicationFacade");
        controller.Should().Contain("LoadScopedRunPairAsync");
        controller.Should().Contain("MapScopedRunPairLoadOutcome");
        controller.Should().Contain("LeftLifecycleIncomplete");
        controller.Should().Contain("CompareRuns");
        controller.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion444_448_remediation_409_and_openapi_declarations()
    {
        string remediationController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "RemediationInstancesController.cs"));
        string comparisonController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.cs"));
        string manifestsCompare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Compare.cs"));
        string packsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));

        remediationController.Should().Contain("IsSealedManifestConflict");
        remediationController.Should().Contain("ConflictProblem");
        comparisonController.Should().Contain("Status409Conflict");
        manifestsCompare.Should().Contain("Status409Conflict");
        packsController.Should().Contain("GetExecutiveReviewPacket");
        packsController.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion449_452_compare_and_buyer_manifest_ui_fail_closed()
    {
        string compareBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "compare-run-pair-blocked-reason.ts"));
        string compareChrome = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelVerdictChrome.tsx"));
        string deliverableGrid = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string bundleSection = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestBuyerBundleDownloadSection.tsx"));
        string summaryBundle = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDetailSummaryDecisionsBlocks.tsx"));

        compareBlocked.Should().Contain("compareRunPairBlockedReason");
        compareChrome.Should().Contain("compareRunPairBlockedReason");
        deliverableGrid.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        bundleSection.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        summaryBundle.Should().Contain("ManifestDetailSummaryBundleDownload");
        summaryBundle.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }
}
