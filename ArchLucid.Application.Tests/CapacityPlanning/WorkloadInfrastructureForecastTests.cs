using ArchLucid.Application.CapacityPlanning;
using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class WorkloadInfrastructureForecastTests
{
    [Fact]
    public void Demand_is_sized_by_cpu_and_elapsed_capacity()
    {
        var demands = new[] { new WorkloadInfrastructureForecast.Demand(
            WorkloadInfrastructureForecast.WorkloadKind.ArchitectureReview,
            100, 30m, 50m, 2m, 3m, 0.01m) };
        var capacity = new WorkloadInfrastructureForecast.Capacity(1m, 4m, 0.5m, 1m, 10);
        var result = WorkloadInfrastructureForecast.Estimate(demands, capacity);
        result.CpuSeconds.Should().Be(3000m);
        result.WorkerSeconds.Should().Be(5000m);
        result.RequiredWorkers.Should().Be(3);
        result.Feasible.Should().BeTrue();
        result.CostUsd.Should().BeNull();
    }

    [Fact]
    public void Memory_constraints_cannot_be_solved_with_more_workers()
    {
        var demands = new[] { new WorkloadInfrastructureForecast.Demand(
            WorkloadInfrastructureForecast.WorkloadKind.GraphAnalysis, 1, 10m, 20m, 8m, 0m, 0m) };
        var result = WorkloadInfrastructureForecast.Estimate(demands,
            new(1m, 4m, 0.75m, 1m, 10));
        result.Feasible.Should().BeFalse();
    }

    [Fact]
    public void Caller_supplied_prices_produce_deterministic_scenario()
    {
        var result = WorkloadInfrastructureForecast.Estimate(
            [new(WorkloadInfrastructureForecast.WorkloadKind.AiInference, 2, 1m, 2m, 1m, 1m, 1m, 100m, 50m)],
            new(1m, 2m, 0.5m, 1m, 2),
            new(1m, 1m, 1m, 1m, 1m, 1m));
        result.CostUsd.Should().Be(310m);
    }

    [Fact]
    public void Queue_windows_accumulate_and_drain()
    {
        var result = WorkloadQueueForecast.Estimate(0,
            [new(10m, 5m, 10m), new(0m, 5m, 10m)]);
        result.PeakBacklog.Should().Be(50);
        result.EndingBacklog.Should().Be(0);
    }

    [Fact]
    public void Process_wide_cpu_is_not_a_calibration()
    {
        WorkloadCalibration.Assess(new(1, "rev", "review", 100m, 10m, 20m, 1m,
            false, "PROCESS_WIDE")).Valid.Should().BeFalse();
    }

    [Fact]
    public void Forecast_error_zero_actual_is_not_percentage()
    {
        var result = WorkloadForecastAccuracy.Compare(10m, 0m, 20m);
        result.AbsoluteError.Should().Be(10m);
        result.AbsolutePercentageError.Should().BeNull();
        result.ThresholdExceeded.Should().BeFalse();
    }
}
