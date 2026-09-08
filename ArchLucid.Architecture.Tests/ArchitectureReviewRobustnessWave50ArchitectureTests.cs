using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-50 architecture create/review robustness suggestions 585–596.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave50ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion585_590_timelines_trail_ledger_coverage_and_graph_openapi_409()
    {
        string timelinesBundle = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunDetailPageBundleController.Timelines.cs"));
        string sealedGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunDetailPageBundleController.SealedManifestGuard.cs"));
        string authorityReads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityTrail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));
        string technologyLedger = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "TechnologyLedgerController.cs"));
        string clarificationQuestions = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ReviewClarificationQuestionsController.cs"));
        string runCoverage = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunCoverageController.cs"));
        string runCoverageAck = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunCoverageController.Acknowledgement.cs"));
        string runDetailQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Detail.cs"));
        string runProvenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Provenance.cs"));
        string graphSnapshot = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "GraphController.Snapshot.cs"));

        timelinesBundle.Should().Contain("GetTimelinesBundle");
        timelinesBundle.Should().Contain("EnsureSealedManifestReadAllowed");
        timelinesBundle.Should().Contain("Status409Conflict");
        sealedGuard.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("GetReviewTrail");
        authorityReads.Should().Contain("GetReviewTrailRationale");
        authorityReads.Should().Contain("Status409Conflict");
        authorityTrail.Should().Contain("GetRunPipelineTimeline");
        authorityTrail.Should().Contain("GetRunRationale");
        authorityTrail.Should().Contain("Status409Conflict");
        technologyLedger.Should().Contain("GetTechnologyLedger");
        technologyLedger.Should().Contain("SealedManifestReadGuard");
        technologyLedger.Should().Contain("Status409Conflict");
        clarificationQuestions.Should().Contain("GetClarificationQuestions");
        clarificationQuestions.Should().Contain("SealedManifestReadGuard");
        clarificationQuestions.Should().Contain("Status409Conflict");
        runCoverage.Should().Contain("GetRunCoverage");
        runCoverage.Should().Contain("Status409Conflict");
        runCoverageAck.Should().Contain("GetAcknowledgedCoverage");
        runCoverageAck.Should().Contain("Status409Conflict");
        runDetailQuery.Should().Contain("GetRunStageTimeline");
        runDetailQuery.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runDetailQuery.Should().Contain("Status409Conflict");
        runProvenance.Should().Contain("GetInteractiveGraphSnapshot");
        runProvenance.Should().Contain("GetRunDecisions");
        runProvenance.Should().Contain("GetRunEvidence");
        runProvenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runProvenance.Should().Contain("Status409Conflict");
        graphSnapshot.Should().Contain("GetArchitectureGraphTemporalSnapshot");
        graphSnapshot.Should().Contain("SealedManifestReadGuard");
        graphSnapshot.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion591_594_sealed_manifest_aware_reads_and_blocked_reason_helpers()
    {
        string pageBundleClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-run-detail-page-bundle-client.ts"));
        string timelinesBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-detail-timelines-bundle-blocked-reason.ts"));
        string runDetailList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string pipelineBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-pipeline-timeline-blocked-reason.ts"));
        string technologyLedgerApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "technology-ledger.ts"));
        string technologyLedgerBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "technology-ledger-blocked-reason.ts"));
        string clarificationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "review-clarification-questions-api.ts"));
        string clarificationBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "review-clarification-questions-blocked-reason.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));

        pageBundleClient.Should().Contain("fetchRunDetailTimelinesBundle");
        pageBundleClient.Should().Contain("apiGetSealedManifestAware");
        timelinesBlockedReason.Should().Contain("runDetailTimelinesBundleBlockedReason");
        runDetailList.Should().Contain("getRunStageTimeline");
        runDetailList.Should().Contain("getRunPipelineTimeline");
        runDetailList.Should().Contain("apiGetSealedManifestAware");
        pipelineBlockedReason.Should().Contain("runPipelineTimelineBlockedReason");
        technologyLedgerApi.Should().Contain("getTechnologyLedger");
        technologyLedgerApi.Should().Contain("apiGetSealedManifestAware");
        technologyLedgerBlockedReason.Should().Contain("technologyLedgerBlockedReason");
        clarificationApi.Should().Contain("getReviewClarificationQuestions");
        clarificationApi.Should().Contain("apiGetSealedManifestAware");
        clarificationBlockedReason.Should().Contain("reviewClarificationQuestionsBlockedReason");
        graphApi.Should().Contain("getArchitectureGraphPage");
        graphApi.Should().Contain("getArchitectureGraphTemporalSnapshot");
        graphApi.Should().Contain("mergeArchitectureGraphPages");
        graphApi.Should().Contain("apiGetSealedManifestAware");
    }

    [Fact]
    public void Suggestion595_below_fold_fail_closed_ux()
    {
        string pipelineTimelineSection = File.ReadAllText(
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
                "RunDetailPipelineTimelineSection.tsx"));
        string pipelineTimelineLoader = File.ReadAllText(
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
                "load-run-detail-pipeline-timeline-cached.ts"));
        string technologyBaseline = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "technology-baseline", "TechnologyBaselinePanel.tsx"));
        string clarificationHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-clarification-questions.ts"));
        string clarificationPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureCreatedClarificationsPanel.tsx"));

        pipelineTimelineSection.Should().Contain("runPipelineTimelineBlockedReason");
        pipelineTimelineLoader.Should().Contain("fetchRunDetailTimelinesBundle");
        technologyBaseline.Should().Contain("technologyLedgerBlockedReason");
        clarificationHook.Should().Contain("reviewClarificationQuestionsBlockedReason");
        clarificationPanel.Should().Contain("clarificationQuestionsBlockedReason");
    }

    [Fact]
    public void Suggestion596_sponsor_summary_export_anchor_consolidation()
    {
        string pageHeader = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPageHeader.tsx"));
        string summaryExportApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-summary-export-api.ts"));
        string summaryExportDownload = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-run-summary-export.ts"));
        string downloadUrls = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-urls.ts"));

        pageHeader.Should().Contain("downloadRunSummaryExport");
        summaryExportApi.Should().Contain("getRunSummaryExportUrl");
        summaryExportDownload.Should().Contain("downloadScopedProxyFileGet");
        summaryExportDownload.Should().Contain("getRunSummaryExportUrl");
        downloadUrls.Should().Contain("getRunSummaryExportUrl");
        downloadUrls.Should().Contain("/v1/architecture/run/");
    }
}
