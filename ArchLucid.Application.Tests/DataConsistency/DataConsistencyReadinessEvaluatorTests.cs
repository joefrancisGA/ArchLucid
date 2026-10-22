using ArchLucid.Application.DataConsistency;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Application.Tests.DataConsistency;

[Trait("Category", "Unit")]
public sealed class DataConsistencyReadinessEvaluatorTests
{
    [Fact]
    public void Evaluate_critical_finding_is_unhealthy()
    {
        DataConsistencyReport report = new(
            DateTime.UtcNow,
            [new DataConsistencyFinding("run_cache_database_divergence", DataConsistencyFindingSeverity.Critical, "x", [])],
            false);

        HealthCheckResult result = DataConsistencyReadinessEvaluator.Evaluate(report, new DataConsistencyReconciliationOptions());

        result.Status.Should().Be(HealthStatus.Unhealthy);
    }

    [Fact]
    public void Evaluate_stale_in_flight_warning_does_not_block_when_option_disabled()
    {
        DataConsistencyReport report = new(
            DateTime.UtcNow,
            [new DataConsistencyFinding(DataConsistencyReadinessEvaluator.StaleInFlightRunsCheckName, DataConsistencyFindingSeverity.Warning, "x", [])],
            false);

        DataConsistencyReconciliationOptions options = new() { StaleInFlightRunsBlockReadiness = false };

        HealthCheckResult result = DataConsistencyReadinessEvaluator.Evaluate(report, options);

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public void Evaluate_stale_in_flight_warning_blocks_when_option_enabled()
    {
        DataConsistencyReport report = new(
            DateTime.UtcNow,
            [new DataConsistencyFinding(DataConsistencyReadinessEvaluator.StaleInFlightRunsCheckName, DataConsistencyFindingSeverity.Warning, "x", [])],
            false);

        DataConsistencyReconciliationOptions options = new() { StaleInFlightRunsBlockReadiness = true };

        HealthCheckResult result = DataConsistencyReadinessEvaluator.Evaluate(report, options);

        result.Status.Should().Be(HealthStatus.Degraded);
    }

    [Fact]
    public void Evaluate_orphan_warning_still_blocks_when_stale_option_disabled()
    {
        DataConsistencyReport report = new(
            DateTime.UtcNow,
            [new DataConsistencyFinding("orphan_golden_manifests_run", DataConsistencyFindingSeverity.Warning, "x", [])],
            false);

        DataConsistencyReconciliationOptions options = new() { StaleInFlightRunsBlockReadiness = false };

        HealthCheckResult result = DataConsistencyReadinessEvaluator.Evaluate(report, options);

        result.Status.Should().Be(HealthStatus.Degraded);
    }
}
