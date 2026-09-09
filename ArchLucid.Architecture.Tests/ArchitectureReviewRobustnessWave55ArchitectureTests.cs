using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-55 architecture create/review robustness suggestions 645–656.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave55ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion645_648_export_compare_comparisons_replay_drift_and_search_openapi_409()
    {
        string exports = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string comparisonsHistory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.History.cs"));
        string comparisonGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.SealedManifestGuard.cs"));
        string comparisonsReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Replay.cs"));
        string comparisonsDrift = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Drift.cs"));

        exports.Should().Contain("CompareExportRecords");
        exports.Should().Contain("EnsureSealedManifestReadAllowedForExportRecordAsync");
        exports.Should().Contain("CompareExportRecordsSummary");
        comparisonsHistory.Should().Contain("SearchComparisonRecords");
        comparisonsHistory.Should().Contain("EnsureSealedManifestReadAllowedForComparisonSearchQueryAsync");
        comparisonsHistory.Should().Contain("Status409Conflict");
        comparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
        comparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonSearchQueryAsync");
        comparisonsReplay.Should().Contain("GetComparisonReplayCostEstimate");
        comparisonsReplay.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
        comparisonsReplay.Should().Contain("Status409Conflict");
        comparisonsDrift.Should().Contain("AnalyzeComparisonDrift");
        comparisonsDrift.Should().Contain("GetComparisonDriftReport");
        comparisonsDrift.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
        comparisonsDrift.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion649_651_governance_lineage_rationale_and_assigned_to_me_count_openapi_409()
    {
        string governanceInsights = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceController.Insights.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceController.SealedManifestGuard.cs"));
        string stickinessRegisters = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Registers.cs"));
        string stickinessFacade = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "Stickiness", "GovernanceStickinessFacade.cs"));

        governanceInsights.Should().Contain("GetApprovalRequestLineage");
        governanceInsights.Should().Contain("GetApprovalRequestRationale");
        governanceInsights.Should().Contain("EnsureSealedManifestReadAllowedForApprovalRequestAsync");
        governanceInsights.Should().Contain("Status409Conflict");
        governanceGuard.Should().Contain("EnsureSealedManifestReadAllowedForApprovalRequestAsync");
        stickinessRegisters.Should().Contain("GetAssignedToMeFindingsCount");
        stickinessRegisters.Should().Contain("Status409Conflict");
        stickinessFacade.Should().Contain("GetAssignedToMeFindingsCountAsync");
        stickinessFacade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
    }

    [Fact]
    public void Suggestion652_trace_forensics_by_trace_id_openapi_409()
    {
        string forensics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.cs"));

        forensics.Should().Contain("GetTraceForensicsByTraceId");
        forensics.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        forensics.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion653_656_governance_lineage_assigned_count_replay_cost_and_temporal_graph_clients()
    {
        string approvalsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string lineageHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "hooks",
                "use-approval-request-lineage-query.ts"));
        string lineagePageHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "approval-requests",
                "[id]",
                "lineage",
                "_sections",
                "use-governance-approval-lineage-page.ts"));
        string lineageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-approval-lineage-blocked-reason.ts"));
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
        string replayCostApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-replay-cost-api.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string temporalBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "architecture-graph-temporal-snapshot-blocked-reason.ts"));

        approvalsApi.Should().Contain("getApprovalRequestLineage");
        approvalsApi.Should().Contain("getGovernanceApprovalRationale");
        approvalsApi.Should().Contain("apiGetSealedManifestAware");
        lineageHook.Should().Contain("governanceApprovalLineageBlockedReason");
        lineagePageHook.Should().Contain("governanceApprovalLineageBlockedReason");
        lineageBlocked.Should().Contain("governanceApprovalLineageBlockedReason");
        stickinessApi.Should().Contain("getGovernanceAssignedToMeFindingsCount");
        stickinessApi.Should().Contain("apiGetSealedManifestAware");
        assignedCountBlocked.Should().Contain("governanceAssignedToMeCountBlockedReason");
        replayCostApi.Should().Contain("fetchArchitectureComparisonReplayCostEstimate");
        replayCostApi.Should().Contain("apiGetSealedManifestAware");
        graphApi.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        temporalBlocked.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
    }
}
