using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowGraphCardinalityForecastTests
{
    [Fact]
    public void Empty_graph_has_zero_expansion()
    {
        var result = SecureNowGraphCardinalityForecast.Estimate(new(0, 0, 3, 0, 4));
        result.ExpansionUpperBound.Should().Be(0);
        result.Saturated.Should().BeFalse();
    }

    [Fact]
    public void Sparse_bounded_graph_uses_geometric_path_prefix_envelope()
    {
        var result = SecureNowGraphCardinalityForecast.Estimate(new(100, 200, 3, 2, 3));
        result.ExpansionUpperBound.Should().Be(80);
        result.MeanOutDegree.Should().Be(2);
        result.EvidenceStatus.Should().Be("THEORETICAL_ENVELOPE_UNCALIBRATED");
    }

    [Fact]
    public void Zero_branching_counts_only_seed_paths()
    {
        var result = SecureNowGraphCardinalityForecast.Estimate(new(20, 0, 4, 2, 0));
        result.ExpansionUpperBound.Should().Be(2);
    }

    [Fact]
    public void Explosive_graph_saturates_instead_of_overflowing()
    {
        var result = SecureNowGraphCardinalityForecast.Estimate(new(100, 1000, 64, 100, int.MaxValue));
        result.Saturated.Should().BeTrue();
        result.ExpansionUpperBound.Should().Be(long.MaxValue);
    }

    [Fact]
    public void Invalid_depth_and_seed_counts_fail_closed()
    {
        Action depth = () => SecureNowGraphCardinalityForecast.Estimate(new(5, 1, 65, 1, 2));
        depth.Should().Throw<ArgumentOutOfRangeException>();
        Action seeds = () => SecureNowGraphCardinalityForecast.Estimate(new(5, 1, 2, 6, 2));
        seeds.Should().Throw<ArgumentException>();
    }
}
