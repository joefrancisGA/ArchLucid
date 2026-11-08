using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowCapacityCostForecastTests
{
    [Fact]
    public void Scenario_cost_breakdown_is_deterministic_and_unverified_by_default()
    {
        var workload = new SecureNowCapacityCostForecast.Workload(10, 20m, 2m, 30m, 5m, 4m);
        var rates = new SecureNowCapacityCostForecast.Rates(0.01m, 0.001m, 2m, 0.1m);
        var result = SecureNowCapacityCostForecast.Calculate(workload, rates, false);
        result.ComputeUsd.Should().Be(2.6m);
        result.StorageUsd.Should().Be(10m);
        result.SqlUsd.Should().Be(4m);
        result.TotalUsd.Should().Be(16.6m);
        result.Calibrated.Should().BeFalse();
        result.EvidenceStatus.Should().Be("UNCALIBRATED_SCENARIO");
    }

    [Fact]
    public void Empty_workload_is_zero()
    {
        var result = SecureNowCapacityCostForecast.Calculate(
            new(0, 0, 0, 0, 0, 0), new(0, 0, 0, 0), false);
        result.TotalUsd.Should().Be(0m);
    }

    [Fact]
    public void Negative_values_are_rejected()
    {
        Action run = () => SecureNowCapacityCostForecast.Calculate(
            new(1, -1, 1, 1, 1, 1), new(1, 1, 1, 1), false);
        run.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Unrepresentable_scenario_fails_closed()
    {
        Action run = () => SecureNowCapacityCostForecast.Calculate(
            new(long.MaxValue, decimal.MaxValue, 1, 1, 1, 1),
            new(1, 1, 1, 1), false);
        run.Should().Throw<OverflowException>();
    }
}
