using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-112 architecture create/review robustness suggestions 1329–1340.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave112ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1329_1331_page_bundle_critical_timelines_and_workspace_context_sealed_manifest_mappers()
    {
        string critical = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.Critical.cs"));
        string timelines = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.Timelines.cs"));
        string workspaceContext = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.WorkspaceContext.cs"));

        critical.Should().Contain("MapRunDetailPageBundleSealedManifestConflict");
        timelines.Should().Contain("MapRunDetailPageBundleSealedManifestConflict");
        workspaceContext.Should().Contain("MapRunDetailPageBundleSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1332_1335_run_summary_detail_buyer_summary_and_retrieval_grounding_sealed_manifest_mappers()
    {
        string runDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));

        runDetail.Should().Contain("MapRunQuerySealedManifestConflict");
        runDetail.Should().Contain("GetRunSummary");
        runDetail.Should().Contain("GetBuyerRunDetailSummary");
        runDetail.Should().Contain("GetRunRetrievalGrounding");
    }

    [Fact]
    public void Suggestion1336_1340_page_bundle_timelines_workspace_context_and_run_detail_read_blocked_reason_wiring()
    {
        string pageBundleClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-run-detail-page-bundle-client.ts"));
        string timelinesBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-detail-timelines-bundle-blocked-reason.ts"));
        string pageBundleBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-detail-page-bundle-blocked-reason.ts"));
        string runsList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string runSummaryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-summary-blocked-reason.ts"));
        string buyerSummaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "buyer-run-detail-summary-blocked-reason.ts"));
        string detailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string retrievalBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-retrieval-grounding-blocked-reason.ts"));

        pageBundleClient.Should().Contain("runDetailTimelinesBundleBlockedReason");
        pageBundleClient.Should().Contain("fetchRunDetailTimelinesBundle");
        pageBundleClient.Should().Contain("workspaceContextBundleBlockedReason");
        pageBundleClient.Should().Contain("fetchRunDetailWorkspaceContextBundle");
        timelinesBlocked.Should().Contain("runDetailTimelinesBundleBlockedReason");
        pageBundleBlocked.Should().Contain("workspaceContextBundleBlockedReason");
        runsList.Should().Contain("runSummaryBlockedReason");
        runsList.Should().Contain("getRunSummary");
        runsList.Should().Contain("buyerRunDetailSummaryBlockedReason");
        runsList.Should().Contain("getBuyerRunDetailSummary");
        buyerSummaryBlocked.Should().Contain("buyerRunDetailSummaryBlockedReason");
        detailArtifacts.Should().Contain("runRetrievalGroundingBlockedReason");
        detailArtifacts.Should().Contain("getRunRetrievalGrounding");
        retrievalBlocked.Should().Contain("runRetrievalGroundingBlockedReason");
    }
}
