using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-51 architecture create/review robustness suggestions 597–608.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave51ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion597_601_run_detail_summary_events_roi_and_source_context_openapi_409()
    {
        string runDetailQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Detail.cs"));
        string authorityRunDetail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.RunDetail.cs"));
        string runEvents = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityRunEventsController.cs"));
        string productPublish = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.ProductPublish.cs"));

        runDetailQuery.Should().Contain("GetRun");
        runDetailQuery.Should().Contain("GetRunRoiEstimate");
        runDetailQuery.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runDetailQuery.Should().Contain("Status409Conflict");
        authorityRunDetail.Should().Contain("GetRunSummary");
        authorityRunDetail.Should().Contain("GetRunDetail");
        authorityRunDetail.Should().Contain("SealedManifestReadGuard");
        authorityRunDetail.Should().Contain("Status409Conflict");
        runEvents.Should().Contain("GetRunEvents");
        runEvents.Should().Contain("SealedManifestReadGuard");
        runEvents.Should().Contain("Status409Conflict");
        productPublish.Should().Contain("GetProductRunSourceContextAsync");
        productPublish.Should().Contain("SealedManifestReadGuard");
        productPublish.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion602_605_sealed_manifest_aware_reads_and_blocked_reason_helpers()
    {
        string runDetailList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string runSummaryBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-summary-blocked-reason.ts"));
        string runSummaryQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-summary-query.ts"));
        string runDetailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string closedLoopApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-intelligence-api-closed-loop.ts"));
        string aiBlockedReason = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-source-context-blocked-reason.ts"));
        string aiSourceContextQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-intelligence-source-context-query.ts"));
        string aiProductContext = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "use-architecture-intelligence-product-context.ts"));

        runDetailList.Should().Contain("getRunSummary");
        runDetailList.Should().Contain("apiGetSealedManifestAware");
        runSummaryBlockedReason.Should().Contain("runSummaryBlockedReason");
        runSummaryQuery.Should().Contain("runSummaryBlockedReason");
        runDetailArtifacts.Should().Contain("getRunDetail");
        runDetailArtifacts.Should().Contain("/v1/runs/");
        runDetailArtifacts.Should().Contain("apiGetSealedManifestAware");
        closedLoopApi.Should().Contain("fetchArchitectureIntelligenceProductSourceContext");
        closedLoopApi.Should().Contain("apiGetSealedManifestAware");
        aiBlockedReason.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        aiSourceContextQuery.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        aiProductContext.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
    }

    [Fact]
    public void Suggestion604_compare_and_progress_fail_closed_ux()
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
        string runSummaryStream = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "useRunSummaryStream.ts"));
        string progressTracker = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunProgressTracker.tsx"));
        string commitRunButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CommitRunButton.tsx"));

        compareFormFetch.Should().Contain("runSummaryBlockedReason");
        runSummaryStream.Should().Contain("runSummaryBlockedReason");
        progressTracker.Should().Contain("run-progress-summary-blocked-reason");
        commitRunButton.Should().Contain("runSummaryBlockedReason");
    }

    [Fact]
    public void Suggestion606_608_programmatic_downloads_and_collateral_cleanup()
    {
        string sponsorRoiCsvDownload = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-sponsor-roi-csv-export.ts"));
        string sponsorRoiSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorRoiSummarySection.tsx"));
        string manifestCompareDownload = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-manifest-compare-export.ts"));
        string compareDiffStack = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelDiffStack.tsx"));
        string sponsorBannerHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));
        string sponsorExportActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string downloadUrls = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-urls.ts"));

        sponsorRoiCsvDownload.Should().Contain("downloadSponsorRoiCsvExport");
        sponsorRoiCsvDownload.Should().Contain("getSponsorRoiCsvExportUrl");
        sponsorRoiSection.Should().Contain("downloadSponsorRoiCsvExport");
        manifestCompareDownload.Should().Contain("downloadManifestCompareExport");
        manifestCompareDownload.Should().Contain("getManifestCompareExportDownloadUrl");
        compareDiffStack.Should().Contain("downloadManifestCompareExport");
        sponsorBannerHook.Should().NotContain("first-value-report");
        sponsorExportActions.Should().Contain("downloadPilotFirstValueReportMarkdown");
        downloadUrls.Should().Contain("getTraceabilityBundleDownloadUrl");
        downloadUrls.Should().Contain("/v1/runs/");
        downloadUrls.Should().Contain("review-trail/export");
    }
}
