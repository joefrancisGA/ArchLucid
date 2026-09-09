using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-56 architecture create/review robustness suggestions 657–668.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave56ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion657_662_export_dashboard_agent_compare_and_replay_openapi_409()
    {
        string runsExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsExportController.cs"));
        string runsExportGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsExportController.SealedManifestGuard.cs"));
        string architectureExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArchitectureExportController.cs"));
        string architectureExportGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArchitectureExportController.SealedManifestGuard.cs"));
        string governanceInsights = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceController.Insights.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceController.SealedManifestGuard.cs"));
        string runComparisonAgents = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Agents.cs"));
        string runComparisonGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.SealedManifestGuard.cs"));
        string comparisonsReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Replay.cs"));

        runsExport.Should().Contain("Export");
        runsExport.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runsExportGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        architectureExport.Should().Contain("ExportRunSummary");
        architectureExport.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        architectureExportGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        governanceInsights.Should().Contain("GetDashboard");
        governanceInsights.Should().Contain("GetComplianceDriftTrend");
        governanceInsights.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
        governanceInsights.Should().Contain("Status409Conflict");
        governanceGuard.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
        runComparisonAgents.Should().Contain("CompareAgentResults");
        runComparisonAgents.Should().Contain("CompareAgentResultsSummary");
        runComparisonAgents.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runComparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        comparisonsReplay.Should().Contain("ReplayComparison");
        comparisonsReplay.Should().Contain("ReplayComparisonMetadata");
        comparisonsReplay.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
    }

    [Fact]
    public void Suggestion667_finding_dispositions_list_openapi_409()
    {
        string dispositions = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Dispositions.cs"));
        string dispositionFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.Dispositions.cs"));

        dispositions.Should().Contain("ListDispositions");
        dispositions.Should().Contain("Status409Conflict");
        dispositionFacade.Should().Contain("ListDispositionsAsync");
        dispositionFacade.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion663_665_export_and_comparison_record_clients()
    {
        string exportRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-api.ts"));
        string exportRecordHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-query.ts"));
        string exportRecordBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "export-record-blocked-reason.ts"));
        string runComparisonHistoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-comparison-history-api.ts"));
        string runComparisonHistoryHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-comparison-history-query.ts"));
        string runComparisonHistoryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "run-comparison-history-blocked-reason.ts"));
        string comparisonRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));
        string comparisonRecordHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-comparison-record-query.ts"));
        string comparisonRecordBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "comparison-record-blocked-reason.ts"));

        exportRecordApi.Should().Contain("getExportRecord");
        exportRecordApi.Should().Contain("apiGetSealedManifestAware");
        exportRecordHook.Should().Contain("exportRecordBlockedReason");
        exportRecordBlocked.Should().Contain("exportRecordBlockedReason");
        runComparisonHistoryApi.Should().Contain("getRunComparisonHistory");
        runComparisonHistoryApi.Should().Contain("apiGetSealedManifestAware");
        runComparisonHistoryHook.Should().Contain("runComparisonHistoryBlockedReason");
        runComparisonHistoryBlocked.Should().Contain("runComparisonHistoryBlockedReason");
        comparisonRecordApi.Should().Contain("getComparisonRecord");
        comparisonRecordApi.Should().Contain("getComparisonSummary");
        comparisonRecordApi.Should().Contain("apiGetSealedManifestAware");
        comparisonRecordHook.Should().Contain("comparisonRecordBlockedReason");
        comparisonRecordBlocked.Should().Contain("comparisonRecordBlockedReason");
    }

    [Fact]
    public void Suggestion666_668_governance_dashboard_and_disposition_clients()
    {
        string dashboardApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-dashboard.ts"));
        string dashboardBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-dashboard-blocked-reason.ts"));
        string dispositionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-dispositions.ts"));
        string dispositionsBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "finding-dispositions-blocked-reason.ts"));

        dashboardApi.Should().Contain("getGovernanceDashboard");
        dashboardApi.Should().Contain("getComplianceDriftTrend");
        dashboardApi.Should().Contain("apiGetSealedManifestAware");
        dashboardBlocked.Should().Contain("governanceDashboardBlockedReason");
        dashboardBlocked.Should().Contain("complianceDriftTrendBlockedReason");
        dispositionsApi.Should().Contain("listFindingDispositions");
        dispositionsApi.Should().Contain("apiGetSealedManifestAware");
        dispositionsBlocked.Should().Contain("findingDispositionsBlockedReason");
    }
}
