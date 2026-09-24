using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramEdgeCrossingCounterTests
{
    [Fact]
    public void Count_returns_zero_for_empty_or_single_route_lists()
    {
        DiagramEdgeCrossingCounter.Count([]).Should().Be(0);
        DiagramEdgeCrossingCounter.Count([[(0, 0, 10, 0)]]).Should().Be(0);
    }

    [Fact]
    public void Count_detects_one_crossing_between_perpendicular_segments()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes =
        [
            [(0, 5, 10, 5)],
            [(5, 0, 5, 10)],
        ];

        DiagramEdgeCrossingCounter.Count(routes).Should().Be(1);
    }

    [Fact]
    public void Count_ignores_segments_that_share_only_an_endpoint()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes =
        [
            [(0, 0, 10, 0)],
            [(10, 0, 10, 10)],
        ];

        DiagramEdgeCrossingCounter.Count(routes).Should().Be(0);
    }

    [Fact]
    public void Count_detects_three_crossings_for_mutually_crossing_orthogonals()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes =
        [
            [(0, 5, 10, 5)],
            [(2, 0, 2, 10)],
            [(4, 0, 4, 10)],
            [(6, 0, 6, 10)],
        ];

        DiagramEdgeCrossingCounter.Count(routes).Should().Be(3);
    }

    [Fact]
    public void CountAgainst_counts_only_against_prior_routes()
    {
        List<(double X1, double Y1, double X2, double Y2)> candidate = [(0, 5, 10, 5)];
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted =
        [
            [(5, 0, 5, 10)],
            [(8, 0, 8, 10)],
        ];

        DiagramEdgeCrossingCounter.CountAgainst(candidate, alreadyRouted).Should().Be(2);
    }
}
