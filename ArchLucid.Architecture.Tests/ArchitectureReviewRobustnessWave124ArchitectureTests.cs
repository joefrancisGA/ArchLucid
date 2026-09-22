using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-124 architecture create/review robustness suggestions 1473–1484.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave124ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1473_1479_export_dashboard_agent_compare_and_disposition_sealed_manifest_mappers()
    {
        string runsExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsExportController.SealedManifestGuard.cs"));
        string architectureExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArchitectureExportController.SealedManifestGuard.cs"));
        string runComparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.SealedManifestGuard.cs"));
        string runComparisonAgents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.Agents.cs"));
        string governanceInsights = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.Insights.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.SealedManifestGuard.cs"));
        string dispositions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Dispositions.cs"));

        runsExportGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runsExportGuard.Should().Contain("MapRunsExportSealedManifestConflict");
        architectureExportGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        architectureExportGuard.Should().Contain("MapArchitectureExportSealedManifestConflict");
        runComparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runComparisonGuard.Should().Contain("MapRunComparisonSealedManifestConflict");
        runComparisonAgents.Should().Contain("CompareAgentResults");
        runComparisonAgents.Should().Contain("CompareAgentResultsSummary");
        runComparisonAgents.Should().Contain("MapRunComparisonSealedManifestConflict");
        governanceInsights.Should().Contain("GetDashboard");
        governanceInsights.Should().Contain("GetComplianceDriftTrend");
        governanceInsights.Should().Contain("MapGovernanceSealedManifestConflict");
        governanceGuard.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
        dispositions.Should().Contain("ListDispositions");
        dispositions.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1480_1483_export_record_comparison_dashboard_and_disposition_blocked_reason_wiring()
    {
        string exportRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-api.ts"));
        string exportRecordBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "export-record-blocked-reason.ts"));
        string exportRecordHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-query.ts"));
        string comparisonRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));
        string comparisonRecordBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-record-blocked-reason.ts"));
        string comparisonRecordHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-comparison-record-query.ts"));
        string dashboardApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-dashboard.ts"));
        string dashboardBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-dashboard-blocked-reason.ts"));
        string dashboardHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-dashboard-query.ts"));
        string dispositionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-dispositions.ts"));
        string dispositionsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "finding-dispositions-blocked-reason.ts"));

        exportRecordApi.Should().Contain("getExportRecord");
        exportRecordApi.Should().Contain("exportRecordBlockedReason");
        exportRecordBlocked.Should().Contain("exportRecordBlockedReason");
        exportRecordHook.Should().Contain("exportRecordBlockedReason");
        comparisonRecordApi.Should().Contain("getComparisonRecord");
        comparisonRecordApi.Should().Contain("getComparisonSummary");
        comparisonRecordApi.Should().Contain("comparisonRecordBlockedReason");
        comparisonRecordBlocked.Should().Contain("comparisonRecordBlockedReason");
        comparisonRecordHook.Should().Contain("comparisonRecordBlockedReason");
        dashboardApi.Should().Contain("getGovernanceDashboard");
        dashboardApi.Should().Contain("getComplianceDriftTrend");
        dashboardApi.Should().Contain("governanceDashboardBlockedReason");
        dashboardApi.Should().Contain("complianceDriftTrendBlockedReason");
        dashboardBlocked.Should().Contain("governanceDashboardBlockedReason");
        dashboardBlocked.Should().Contain("complianceDriftTrendBlockedReason");
        dashboardHook.Should().Contain("governanceDashboardBlockedReason");
        dispositionsApi.Should().Contain("listFindingDispositions");
        dispositionsApi.Should().Contain("findingDispositionsBlockedReason");
        dispositionsBlocked.Should().Contain("findingDispositionsBlockedReason");
    }

    [Fact]
    public void Suggestion1484_export_record_dashboard_and_disposition_fail_closed_ux()
    {
        string exportRecordCallout = File.ReadAllText(
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
                "RunDetailExportRecordStatusCallout.tsx"));
        string overviewSummary = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "GovernanceOverviewSummaryPanelShell.tsx"));
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

        exportRecordCallout.Should().Contain("run-detail-export-record-blocked");
        exportRecordCallout.Should().Contain("useExportRecordQuery");
        overviewSummary.Should().Contain("governance-overview-sealed-manifest-blocked-reason");
        overviewSummary.Should().Contain("governanceSealedManifestBlockedReason");
        dispositionCallout.Should().Contain("finding-inspect-disposition-blocked");
    }
}
