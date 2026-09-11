using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-123 architecture create/review robustness suggestions 1461–1472.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave123ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1461_1467_export_compare_replay_drift_trace_and_assigned_count_sealed_manifest_mappers()
    {
        string exports = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string comparisonsReplay = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.Replay.cs"));
        string comparisonsDrift = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.Drift.cs"));
        string comparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.SealedManifestGuard.cs"));
        string traceForensicsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.SealedManifestGuard.cs"));
        string stickinessRegisters = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Registers.cs"));

        exports.Should().Contain("CompareExportRecords");
        exports.Should().Contain("CompareExportRecordsSummary");
        exports.Should().Contain("MapExportReplaySealedManifestConflict");
        comparisonsReplay.Should().Contain("GetComparisonReplayCostEstimate");
        comparisonsReplay.Should().Contain("MapComparisonReplaySealedManifestConflict");
        comparisonsDrift.Should().Contain("AnalyzeComparisonDrift");
        comparisonsDrift.Should().Contain("GetComparisonDriftReport");
        comparisonsDrift.Should().Contain("MapComparisonReplaySealedManifestConflict");
        comparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonSearchQueryAsync");
        comparisonGuard.Should().Contain("MapComparisonReplaySealedManifestConflict");
        traceForensicsGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        traceForensicsGuard.Should().Contain("MapTraceForensicsSealedManifestConflict");
        stickinessRegisters.Should().Contain("GetAssignedToMeFindingsCount");
        stickinessRegisters.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1468_1471_export_compare_replay_cost_assigned_count_and_graph_blocked_reason_wiring()
    {
        string exportCompareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-compare-api.ts"));
        string exportCompareBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "exports",
                "export-record-compare-blocked-reason.ts"));
        string exportCompareHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-compare-query.ts"));
        string replayCostApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-replay-cost-api.ts"));
        string replayCostBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-replay-cost-blocked-reason.ts"));
        string stickinessApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-registers.ts"));
        string assignedCountBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-assigned-to-me-count-blocked-reason.ts"));
        string assignedCountHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-assigned-to-me-findings-count-query.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string graphBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "architecture-graph-temporal-snapshot-blocked-reason.ts"));

        exportCompareApi.Should().Contain("compareExportRecords");
        exportCompareApi.Should().Contain("exportRecordCompareBlockedReason");
        exportCompareBlocked.Should().Contain("exportRecordCompareBlockedReason");
        exportCompareHook.Should().Contain("exportRecordCompareBlockedReason");
        replayCostApi.Should().Contain("fetchArchitectureComparisonReplayCostEstimate");
        replayCostApi.Should().Contain("comparisonReplayCostBlockedReason");
        replayCostBlocked.Should().Contain("comparisonReplayCostBlockedReason");
        stickinessApi.Should().Contain("getGovernanceAssignedToMeFindingsCount");
        stickinessApi.Should().Contain("governanceAssignedToMeCountBlockedReason");
        assignedCountBlocked.Should().Contain("governanceAssignedToMeCountBlockedReason");
        assignedCountHook.Should().Contain("governanceAssignedToMeCountBlockedReason");
        graphApi.Should().Contain("getArchitectureGraph");
        graphApi.Should().Contain("architectureGraphReadBlockedReason");
        graphBlocked.Should().Contain("architectureGraphReadBlockedReason");
    }

    [Fact]
    public void Suggestion1472_export_compare_replay_cost_and_assigned_count_fail_closed_ux()
    {
        string exportCompareCallout = File.ReadAllText(
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
                "RunDetailExportRecordCompareCallout.tsx"));
        string replayCostSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "ArchitectureComparisonReplayCostSection.tsx"));
        string assignedCountCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "GovernanceAssignedToMeCountBlockedCallout.tsx"));

        exportCompareCallout.Should().Contain("run-detail-export-record-compare-blocked");
        exportCompareCallout.Should().Contain("useExportRecordCompareQuery");
        replayCostSection.Should().Contain("comparisonReplayCostBlockedReason");
        assignedCountCallout.Should().Contain("governance-assigned-to-me-count-blocked");
        assignedCountCallout.Should().Contain("governanceAssignedToMeCountBlockedReason");
    }
}
