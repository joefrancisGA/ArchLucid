using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-116 architecture create/review robustness suggestions 1377–1388.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave116ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1377_1383_run_detail_summary_sse_and_roi_read_sealed_manifest_mappers()
    {
        string authorityReads = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReadsController.cs"));
        string runDetailQuery = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Detail.cs"));
        string authorityRunDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));
        string runEvents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.cs"));

        authorityReads.Should().Contain("GetRunDetail");
        authorityReads.Should().Contain("MapReviewTrailSealedManifestConflict");
        runDetailQuery.Should().Contain("GetRun");
        runDetailQuery.Should().Contain("GetRunRoiEstimate");
        runDetailQuery.Should().Contain("MapProductRunQuerySealedManifestConflict");
        authorityRunDetail.Should().Contain("GetRunDetail");
        authorityRunDetail.Should().Contain("GetBuyerRunDetailSummary");
        authorityRunDetail.Should().Contain("GetRunSummary");
        authorityRunDetail.Should().Contain("MapRunQuerySealedManifestConflict");
        runEvents.Should().Contain("GetRunEvents");
        runEvents.Should().Contain("MapRunEventsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1384_1387_run_detail_and_summary_stream_blocked_reason_wiring()
    {
        string runDetailBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-detail-blocked-reason.ts"));
        string detailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string runSummaryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-summary-blocked-reason.ts"));
        string runSummaryQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-summary-query.ts"));
        string runSummaryStream = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "useRunSummaryStream.ts"));

        runDetailBlocked.Should().Contain("runDetailBlockedReason");
        detailArtifacts.Should().Contain("getRunDetail");
        detailArtifacts.Should().Contain("/v1/runs/");
        detailArtifacts.Should().Contain("runDetailBlockedReason");
        runSummaryBlocked.Should().Contain("runSummaryBlockedReason");
        runSummaryQuery.Should().Contain("runSummaryBlockedReason");
        runSummaryStream.Should().Contain("runSummaryBlockedReason");
        runSummaryStream.Should().Contain("probeSealedManifestBlock");
    }

    [Fact]
    public void Suggestion1388_compare_and_progress_fail_closed_ux()
    {
        string compareFormFetch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-form-fetch.ts"));
        string progressTracker = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunProgressTracker.tsx"));
        string commitRunButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CommitRunButton.tsx"));

        compareFormFetch.Should().Contain("runSummaryBlockedReason");
        progressTracker.Should().Contain("run-progress-summary-blocked-reason");
        commitRunButton.Should().Contain("runSummaryBlockedReason");
    }
}
