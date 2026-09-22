using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-119 architecture create/review robustness suggestions 1413–1424.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave119ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1413_1419_provenance_and_comparison_history_sealed_manifest_mappers()
    {
        string provenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceController.cs"));
        string provenanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ProvenanceController.SealedManifestGuard.cs"));
        string comparisonHistory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.History.cs"));
        string comparisonsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.SealedManifestGuard.cs"));

        provenance.Should().Contain("GetFullGraph");
        provenance.Should().Contain("GetDecisionGraph");
        provenance.Should().Contain("GetNodeNeighborhood");
        provenance.Should().Contain("MapProvenanceSealedManifestConflict");
        provenanceGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        provenanceGuard.Should().Contain("MapProvenanceSealedManifestConflict");
        comparisonHistory.Should().Contain("GetRunComparisonHistory");
        comparisonHistory.Should().Contain("SearchComparisonRecords");
        comparisonHistory.Should().Contain("MapComparisonReplaySealedManifestConflict");
        comparisonsGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        comparisonsGuard.Should().Contain("MapComparisonReplaySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1420_1422_provenance_alias_and_comparison_history_blocked_reason_wiring()
    {
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "provenance-graph-alias-blocked-reason.ts"));
        string runComparisonHistoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-comparison-history-api.ts"));
        string runComparisonHistoryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "run-comparison-history-blocked-reason.ts"));
        string runComparisonHistoryHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-comparison-history-query.ts"));

        graphApi.Should().Contain("getProvenanceGraph");
        graphApi.Should().Contain("getDecisionSubgraph");
        graphApi.Should().Contain("getNodeNeighborhood");
        graphApi.Should().Contain("/v1/provenance/runs/");
        graphApi.Should().Contain("provenanceGraphAliasBlockedReason");
        provenanceBlocked.Should().Contain("provenanceGraphAliasBlockedReason");
        runComparisonHistoryApi.Should().Contain("getRunComparisonHistory");
        runComparisonHistoryApi.Should().Contain("runComparisonHistoryBlockedReason");
        runComparisonHistoryBlocked.Should().Contain("runComparisonHistoryBlockedReason");
        runComparisonHistoryHook.Should().Contain("runComparisonHistoryBlockedReason");
    }

    [Fact]
    public void Suggestion1423_1424_compare_picked_summary_fail_closed_ux()
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
        string compareFormDiffSubmit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-form-diff-submit.ts"));
        string comparePickers = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareRunPickersSection.tsx"));
        string compareForm = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareForm.tsx"));

        compareFormFetch.Should().Contain("leftSummaryBlockedReason");
        compareFormFetch.Should().Contain("rightSummaryBlockedReason");
        compareFormFetch.Should().Contain("runSummaryBlockedReason");
        compareFormDiffSubmit.Should().Contain("leftSummaryBlockedReason");
        compareFormDiffSubmit.Should().Contain("rightSummaryBlockedReason");
        comparePickers.Should().Contain("compare-left-summary-blocked-reason");
        comparePickers.Should().Contain("compare-right-summary-blocked-reason");
        comparePickers.Should().Contain("leftSummaryBlockedReason");
        compareForm.Should().Contain("leftSummaryBlockedReason");
        compareForm.Should().Contain("rightSummaryBlockedReason");
    }
}
