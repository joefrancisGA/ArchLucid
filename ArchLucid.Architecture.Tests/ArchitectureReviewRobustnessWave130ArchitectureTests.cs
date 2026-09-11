using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-130 architecture create/review robustness suggestions 1545–1556.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave130ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1545_1547_export_history_intelligence_and_comparison_history_ui_wiring()
    {
        string exportHistoryCallout = File.ReadAllText(
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
                "RunDetailExportHistoryCallout.tsx"));
        string comparisonHistoryHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-comparison-history-query.ts"));
        string comparisonHistoryCallout = File.ReadAllText(
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
                "RunDetailExportRecordComparisonHistoryCallout.tsx"));
        string intelligenceCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "ArchitectureIntelligenceRunModelGuardCallout.tsx"));
        string runDetailExports = File.ReadAllText(
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
                "RunDetailArtifactsExportsSection.tsx"));
        string intelligencePage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "ArchitectureIntelligencePageClient.tsx"));

        exportHistoryCallout.Should().Contain("useRunExportHistoryQuery");
        exportHistoryCallout.Should().Contain("run-detail-export-history-blocked");
        comparisonHistoryHook.Should().Contain("exportRecordComparisonHistoryBlockedReason");
        comparisonHistoryCallout.Should().Contain("useExportRecordComparisonHistoryQuery");
        intelligenceCallout.Should().Contain("useArchitectureIntelligenceRunModelQuery");
        runDetailExports.Should().Contain("RunDetailExportHistoryCallout");
        runDetailExports.Should().Contain("RunDetailExportRecordComparisonHistoryCallout");
        intelligencePage.Should().Contain("ArchitectureIntelligenceRunModelGuardCallout");
    }

    [Fact]
    public void Suggestion1548_1553_disposition_timeline_stickiness_evidence_and_graph_alias_ui_wiring()
    {
        string dispositionCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "findings",
                "[findingId]",
                "FindingInspectDispositionBlockedCallout.tsx"));
        string dispositionHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "findings",
                "[findingId]",
                "use-finding-inspect-governance-stickiness-dispositions.ts"));
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
        string stageTimelineHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-stage-timeline-query.ts"));
        string progressTracker = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunProgressTracker.tsx"));
        string stickinessCallout = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "governance", "GovernanceStickinessSummaryGuardCallout.tsx"));
        string explainPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "FindingExplainPanel.tsx"));
        string graphAliasCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "GraphPageProvenanceAliasGuardCallout.tsx"));

        dispositionCallout.Should().Contain("finding-inspect-disposition-blocked");
        dispositionHook.Should().Contain("findingDispositionsBlockedReason");
        pipelineTimelineLoader.Should().Contain("runDetailTimelinesBundleBlockedReason");
        pipelineTimelineSection.Should().Contain("run-detail-pipeline-timeline-blocked-reason");
        pipelineTimelineSection.Should().Contain("runDetailTimelinesBundleBlockedReason");
        stageTimelineHook.Should().Contain("runPipelineTimelineBlockedReason");
        progressTracker.Should().Contain("run-progress-stage-timeline-blocked-reason");
        stickinessCallout.Should().Contain("governanceStickinessSummaryBlockedReason");
        explainPanel.Should().Contain("finding-evidence-chain-blocked-reason");
        graphAliasCallout.Should().Contain("provenanceGraphAliasBlockedReason");
        graphAliasCallout.Should().Contain("authorityProvenanceAliasBlockedReason");
    }

    [Fact]
    public void Suggestion1554_1556_manifest_summary_retrieval_search_runtime_409_and_compare_lifecycle_hint()
    {
        string manifestSummary = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Get.Summary.cs"));
        string manifestGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.SealedManifestGuard.cs"));
        string retrievalController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "RetrievalController.cs"));
        string retrievalGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "RetrievalController.SealedManifestGuard.cs"));
        string compareHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-runs-end-to-end-query.ts"));
        string lifecycleHint = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingCrossReviewLifecycleHint.tsx"));
        string compareCallout = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingCrossReviewCompareBlockedCallout.tsx"));

        manifestSummary.Should().Contain("GetManifestSummary");
        manifestSummary.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        manifestGuard.Should().Contain("ManifestGoldenReadSealedManifestHashGuard");
        retrievalController.Should().Contain("Search");
        retrievalController.Should().Contain("MapRetrievalSealedManifestConflict");
        retrievalGuard.Should().Contain("SealedManifestReadGuard");
        compareHook.Should().Contain("compareRunPairBlockedReason");
        lifecycleHint.Should().Contain("FindingCrossReviewCompareBlockedCallout");
        compareCallout.Should().Contain("finding-cross-review-compare-blocked");
    }
}
