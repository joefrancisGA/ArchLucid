using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-57 architecture create/review robustness suggestions 669–680.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave57ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion669_672_end_to_end_compare_export_and_batch_replay_openapi_409()
    {
        string runComparisonReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Replay.cs"));
        string runComparisonGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.SealedManifestGuard.cs"));
        string comparisonsReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Replay.cs"));
        string comparisonsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.SealedManifestGuard.cs"));

        runComparisonReplay.Should().Contain("CompareRunsEndToEnd");
        runComparisonReplay.Should().Contain("ExportRunsEndToEndComparisonMarkdown");
        runComparisonReplay.Should().Contain("ExportRunsEndToEndComparisonDocx");
        runComparisonReplay.Should().Contain("BuildEndToEndReportAsync");
        runComparisonReplay.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runComparisonReplay.Should().Contain("Status409Conflict");
        runComparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        comparisonsReplay.Should().Contain("ReplayComparisonsBatch");
        comparisonsReplay.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdsAsync");
        comparisonsReplay.Should().Contain("Status409Conflict");
        comparisonsGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdsAsync");
    }

    [Fact]
    public void Suggestion673_676_risk_exceptions_recurrence_export_verify_and_coverage_openapi_409()
    {
        string riskExceptionsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Exceptions.cs"));
        string riskExceptionsFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.RiskExceptions.cs"));
        string schedulesController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Schedules.cs"));
        string recurrenceFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Recurrence.cs"));
        string exportVerify = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.Export.Verify.cs"));
        string exportGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.SealedManifestGuard.cs"));
        string coverageController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.cs"));
        string coverageGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.SealedManifestGuard.cs"));

        riskExceptionsController.Should().Contain("ListRiskExceptions");
        riskExceptionsController.Should().Contain("Status409Conflict");
        riskExceptionsFacade.Should().Contain("ListRiskExceptionsAsync");
        riskExceptionsFacade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
        schedulesController.Should().Contain("ListRecurrenceSchedules");
        schedulesController.Should().Contain("Status409Conflict");
        recurrenceFacade.Should().Contain("ListRecurrenceSchedulesAsync");
        recurrenceFacade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
        exportVerify.Should().Contain("VerifyRunExportLineage");
        exportVerify.Should().Contain("EnsureRunSealedManifestHashOrConflictAsync");
        exportVerify.Should().Contain("Status409Conflict");
        exportGuard.Should().Contain("EnsureRunSealedManifestHashOrConflictAsync");
        coverageController.Should().Contain("GetScopeCoverage");
        coverageController.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        coverageController.Should().Contain("Status409Conflict");
        coverageGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        coverageGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion677_678_risk_exceptions_and_recurrence_schedules_sealed_clients()
    {
        string exceptionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-exceptions-schedules.ts"));
        string riskExceptionsHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-risk-exceptions-query.ts"));
        string recurrenceHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-recurrence-schedules-query.ts"));
        string listBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-stickiness-list-blocked-reason.ts"));
        string queryKeys = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "query", "operator-query-keys.ts"));

        exceptionsApi.Should().Contain("listRiskExceptions");
        exceptionsApi.Should().Contain("listArchitectureReviewRecurrenceSchedules");
        exceptionsApi.Should().Contain("apiGetSealedManifestAware");
        riskExceptionsHook.Should().Contain("riskExceptionsBlockedReason");
        recurrenceHook.Should().Contain("recurrenceSchedulesBlockedReason");
        listBlocked.Should().Contain("riskExceptionsBlockedReason");
        listBlocked.Should().Contain("recurrenceSchedulesBlockedReason");
        queryKeys.Should().Contain("governanceRiskExceptions");
        queryKeys.Should().Contain("governanceRecurrenceSchedules");
    }

    [Fact]
    public void Suggestion679_680_setup_guide_resolution_and_environment_catalog_sealed_clients()
    {
        string dashboardApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-dashboard.ts"));
        string environmentsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-environments.ts"));
        string readBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-workflow-read-blocked-reason.ts"));

        dashboardApi.Should().Contain("fetchGovernanceSetupGuideBundle");
        dashboardApi.Should().Contain("getGovernanceResolution");
        dashboardApi.Should().Contain("apiGetSealedManifestAware");
        environmentsApi.Should().Contain("fetchGovernanceEnvironmentCatalog");
        environmentsApi.Should().Contain("apiGetSealedManifestAware");
        readBlocked.Should().Contain("governanceSetupGuideBlockedReason");
        readBlocked.Should().Contain("governanceResolutionBlockedReason");
        readBlocked.Should().Contain("governanceEnvironmentCatalogBlockedReason");
    }
}
