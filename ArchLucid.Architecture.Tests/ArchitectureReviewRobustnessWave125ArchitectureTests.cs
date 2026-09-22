using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-125 architecture create/review robustness suggestions 1485–1496.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave125ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1485_1492_end_to_end_compare_batch_replay_stickiness_verify_and_coverage_sealed_manifest_mappers()
    {
        string runComparisonReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Replay.cs"));
        string runComparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.SealedManifestGuard.cs"));
        string comparisonsReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Replay.cs"));
        string comparisonsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.SealedManifestGuard.cs"));
        string riskExceptionsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Exceptions.cs"));
        string schedulesController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Schedules.cs"));
        string exportVerify = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Verify.cs"));
        string exportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.SealedManifestGuard.cs"));
        string coverageController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.cs"));
        string coverageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceCoverageController.SealedManifestGuard.cs"));

        runComparisonReplay.Should().Contain("CompareRunsEndToEnd");
        runComparisonReplay.Should().Contain("ExportRunsEndToEndComparisonMarkdown");
        runComparisonReplay.Should().Contain("ExportRunsEndToEndComparisonDocx");
        runComparisonReplay.Should().Contain("BuildEndToEndReportAsync");
        runComparisonReplay.Should().Contain("MapRunComparisonSealedManifestConflict");
        runComparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runComparisonGuard.Should().Contain("MapRunComparisonSealedManifestConflict");
        comparisonsReplay.Should().Contain("ReplayComparisonsBatch");
        comparisonsReplay.Should().Contain("MapComparisonReplaySealedManifestConflict");
        comparisonsGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdsAsync");
        comparisonsGuard.Should().Contain("MapComparisonReplaySealedManifestConflict");
        riskExceptionsController.Should().Contain("ListRiskExceptions");
        riskExceptionsController.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        schedulesController.Should().Contain("ListRecurrenceSchedules");
        schedulesController.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        exportVerify.Should().Contain("VerifyRunExportLineage");
        exportVerify.Should().Contain("MapArtifactExportSealedManifestConflict");
        exportGuard.Should().Contain("EnsureRunSealedManifestHashOrConflictAsync");
        exportGuard.Should().Contain("MapArtifactExportSealedManifestConflict");
        coverageController.Should().Contain("GetScopeCoverage");
        coverageController.Should().Contain("MapGovernanceCoverageSealedManifestConflict");
        coverageGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        coverageGuard.Should().Contain("MapGovernanceCoverageSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1493_1496_risk_recurrence_setup_resolution_and_environment_catalog_blocked_reason_wiring()
    {
        string exceptionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-exceptions-schedules.ts"));
        string listBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-stickiness-list-blocked-reason.ts"));
        string dashboardApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-dashboard.ts"));
        string environmentsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-environments.ts"));
        string readBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));

        exceptionsApi.Should().Contain("listRiskExceptions");
        exceptionsApi.Should().Contain("listArchitectureReviewRecurrenceSchedules");
        exceptionsApi.Should().Contain("apiGet");
        exceptionsApi.Should().Contain("riskExceptionsBlockedReason");
        exceptionsApi.Should().Contain("recurrenceSchedulesBlockedReason");
        listBlocked.Should().Contain("riskExceptionsBlockedReason");
        listBlocked.Should().Contain("recurrenceSchedulesBlockedReason");
        dashboardApi.Should().Contain("fetchGovernanceSetupGuideBundle");
        dashboardApi.Should().Contain("getGovernanceResolution");
        dashboardApi.Should().Contain("apiGet");
        dashboardApi.Should().Contain("governanceSetupGuideBlockedReason");
        dashboardApi.Should().Contain("governanceResolutionBlockedReason");
        environmentsApi.Should().Contain("fetchGovernanceEnvironmentCatalog");
        environmentsApi.Should().Contain("apiGet");
        environmentsApi.Should().Contain("governanceEnvironmentCatalogBlockedReason");
        readBlocked.Should().Contain("governanceSetupGuideBlockedReason");
        readBlocked.Should().Contain("governanceResolutionBlockedReason");
        readBlocked.Should().Contain("governanceEnvironmentCatalogBlockedReason");
    }

    [Fact]
    public void Suggestion1493_1496_stickiness_and_governance_read_fail_closed_hooks()
    {
        string riskExceptionsHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-risk-exceptions-query.ts"));
        string recurrenceHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-recurrence-schedules-query.ts"));
        string environmentHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-environment-catalog-query.ts"));
        string setupStatus = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "setup",
                "_sections",
                "resolve-governance-setup-status.ts"));
        string resolutionPage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "standards-and-rules",
                "_sections",
                "use-governance-resolution-page.ts"));
        string queryKeys = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "query", "operator-query-keys.ts"));

        riskExceptionsHook.Should().Contain("riskExceptionsBlockedReason");
        recurrenceHook.Should().Contain("recurrenceSchedulesBlockedReason");
        environmentHook.Should().Contain("governanceEnvironmentCatalogBlockedReason");
        setupStatus.Should().Contain("governanceSetupGuideBlockedReason");
        resolutionPage.Should().Contain("governanceResolutionBlockedReason");
        queryKeys.Should().Contain("governanceRiskExceptions");
        queryKeys.Should().Contain("governanceRecurrenceSchedules");
    }
}
