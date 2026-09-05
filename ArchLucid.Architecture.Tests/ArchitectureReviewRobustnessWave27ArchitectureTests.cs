using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-27 architecture create/review robustness suggestions (259–279 carryover batch).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave27ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion259_260_alert_simulation_primary_and_compare_fail_closed_on_sealed_hash()
    {
        string simulate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Alerts",
                "AlertSimulationController.Simulate.cs"));
        string compare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Alerts",
                "AlertSimulationController.CompareCandidates.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Alerts",
                "AlertSimulationController.SealedManifestGuard.cs"));

        simulate.Should().Contain("IsSealedManifestSimulationBlock");
        compare.Should().Contain("IsSealedManifestSimulationBlock");
        guard.Should().Contain("Alert simulation blocked");
    }

    [Fact]
    public void Suggestion261_alert_simulation_multi_run_sweep_skips_unverified_runs()
    {
        string provider = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Alerts",
                "Simulation",
                "AlertSimulationContextProvider.cs"));

        provider.Should().Contain("skipOnSealedHashFailure: true");
        provider.Should().Contain("skipOnSealedHashFailure: false");
        provider.Should().Contain("AlertSimulationSealedManifestHashGuard.TryEnsureRunSealedManifestHash");
    }

    [Fact]
    public void Suggestion263_264_production_alert_evaluate_fail_closed_on_sealed_hash()
    {
        string alertService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertService.cs"));
        string composite = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "CompositeAlertService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertEvaluateSealedManifestHashGuard.cs"));

        alertService.Should().Contain("AlertEvaluateSealedManifestHashGuard");
        composite.Should().Contain("AlertEvaluateSealedManifestHashGuard");
        guard.Should().Contain("AlertDeliverySealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion265_alert_persist_reverify_fail_closed_on_sealed_hash()
    {
        string alertService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertService.cs"));
        string composite = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "CompositeAlertService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertPersistSealedManifestHashGuard.cs"));

        alertService.Should().Contain("AlertPersistSealedManifestHashGuard");
        composite.Should().Contain("AlertPersistSealedManifestHashGuard");
        guard.Should().Contain("AlertDeliverySealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion266_267_alert_outbox_manifest_hash_metadata()
    {
        string publishing = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertIntegrationEventPublishing.cs"));
        string resolver = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Alerts",
                "AlertIntegrationEventManifestHashResolver.cs"));
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));

        publishing.Should().Contain("AlertIntegrationEventManifestHashResolver");
        publishing.Should().Contain("manifestHash");
        resolver.Should().Contain("ComputeHash");
        resolver.Should().Contain("GetRunDetailForManifestCompareAsync");
        outboxGuard.Should().Contain("IntegrationEventTypes.AlertFiredV1");
        outboxGuard.Should().Contain("IntegrationEventTypes.AlertAcknowledgedV1");
        outboxGuard.Should().Contain("IntegrationEventTypes.AlertResolvedV1");
    }

    [Fact]
    public void Suggestion272_sponsor_roi_multi_run_rollup_fail_closed_on_sealed_hash()
    {
        string summary = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiSummaryBuilder.cs"));
        string history = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiHistoryBuilder.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiBoardPackSealedManifestGuard.cs"));

        summary.Should().Contain("EnsureSummaryRunsSealedOrThrowAsync");
        history.Should().Contain("EnsureRunIdsSealedOrThrowAsync");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion277_278_sponsor_roi_json_get_and_export_fail_closed_on_sealed_hash()
    {
        string export = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiExportBuilder.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        export.Should().Contain("EnsureRunIdsSealedOrThrowAsync");
        controller.Should().Contain("ConflictException");
        controller.Should().Contain("sponsor-report");
    }

    [Fact]
    public void Suggestion279_governance_insights_and_posture_fail_closed_on_sealed_hash()
    {
        string dashboard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "GovernanceDashboardService.cs"));
        string insightsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "GovernanceInsightsSealedManifestHashGuard.cs"));
        string posture = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Posture",
                "ArchitecturePostureService.cs"));
        string postureGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Posture",
                "GovernancePostureSealedManifestHashGuard.cs"));

        dashboard.Should().Contain("GovernanceInsightsSealedManifestHashGuard");
        insightsGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        posture.Should().Contain("GovernancePostureSealedManifestHashGuard");
        postureGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }
}
