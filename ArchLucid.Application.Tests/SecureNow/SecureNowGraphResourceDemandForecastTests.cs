using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowGraphResourceDemandForecastTests
{
    private static readonly SecureNowGraphResourceDemandForecast.Calibration Reference =
        new("benchmark-123", 100, 20m, 3m, 40m, 200);

    [Fact]
    public void Missing_calibration_never_invents_resource_usage()
    {
        var topology = new SecureNowTopologyCardinalityForecast.Result(50, 60, 20, false, "TOPOLOGY_STRUCTURAL_ONLY");
        var result = SecureNowGraphResourceDemandForecast.Estimate(topology, null);
        result.ForecastAvailable.Should().BeFalse();
        result.CpuSeconds.Should().BeNull();
        result.EvidenceStatus.Should().Be("MISSING_CALIBRATION");
    }

    [Fact]
    public void Calibrated_scenario_interpolates_within_envelope()
    {
        var topology = new SecureNowTopologyCardinalityForecast.Result(50, 60, 20, false, "TOPOLOGY_STRUCTURAL_ONLY");
        var result = SecureNowGraphResourceDemandForecast.Estimate(topology, Reference);
        result.ForecastAvailable.Should().BeTrue();
        result.CpuSeconds.Should().Be(10m);
        result.PeakGiB.Should().Be(3m);
        result.WorkerSeconds.Should().Be(20m);
        result.EvidenceStatus.Should().Be("CALIBRATED_INPUT_LINEAR_SCENARIO");
    }

    [Fact]
    public void Truncated_graph_or_out_of_range_workload_is_not_forecast()
    {
        foreach (var (count, truncated) in new[] { (50L, true), (201L, false) })
        {
            var topology = new SecureNowTopologyCardinalityForecast.Result(count, count, 1, truncated, "STRUCTURAL");
            SecureNowGraphResourceDemandForecast.Estimate(topology, Reference)
                .ForecastAvailable.Should().BeFalse();
        }
    }

    [Fact]
    public void Invalid_calibration_is_rejected()
    {
        var topology = new SecureNowTopologyCardinalityForecast.Result(10, 10, 5, false, "STRUCTURAL");
        var invalid = Reference with { MeasuredPrefixCount = 0 };
        Action action = () => SecureNowGraphResourceDemandForecast.Estimate(topology, invalid);
        action.Should().Throw<ArgumentException>();
    }
}
