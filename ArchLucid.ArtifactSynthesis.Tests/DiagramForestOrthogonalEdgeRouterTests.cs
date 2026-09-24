using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestOrthogonalEdgeRouterTests
{
    [Fact]
    public void Route_prefers_a_straight_segment_when_it_does_not_cross_an_obstacle()
    {
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
            [new DiagramForestOrthogonalEdgeRouter.Rect(50, 50, 40, 40)];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 120,
            toY: 0,
            obstacles);

        route.Segments.Should().ContainSingle();
        route.Segments[0].Should().Be((0.0d, 0.0d, 120.0d, 0.0d));
        route.UsedFallback.Should().BeFalse();
        route.PathData.Should().Be("M 0 0 H 120");
    }

    [Fact]
    public void Route_uses_an_elbow_for_unobstructed_diagonal_offset_endpoints()
    {
        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 120,
            toY: 80,
            obstacles: []);

        route.UsedFallback.Should().BeFalse();
        route.Segments.Count.Should().BeGreaterThan(1);
        route.PathData.Should().Contain(" H ");
        route.PathData.Should().Contain(" V ");
    }

    [Fact]
    public void Route_uses_an_elbow_when_a_straight_segment_would_cross_an_obstacle()
    {
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
            [new DiagramForestOrthogonalEdgeRouter.Rect(50, 30, 20, 20)];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 120,
            toY: 80,
            obstacles);

        route.UsedFallback.Should().BeFalse();
        route.Segments.Count.Should().BeGreaterThan(1);
    }

    [Fact]
    public void Route_detects_diagonal_straight_segments_that_cross_an_obstacle()
    {
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
            [new DiagramForestOrthogonalEdgeRouter.Rect(40, 40, 20, 20)];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            obstacles);

        route.Segments.Count.Should().BeGreaterThan(1);
        route.UsedFallback.Should().BeFalse();
    }

    [Fact]
    public void Route_uses_fallback_straight_segment_when_no_elbow_clears_obstacles()
    {
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
        [
            new DiagramForestOrthogonalEdgeRouter.Rect(40, -20, 40, 40),
            new DiagramForestOrthogonalEdgeRouter.Rect(40, 20, 40, 40),
        ];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 120,
            toY: 0,
            obstacles);

        route.Segments.Should().ContainSingle();
        route.UsedFallback.Should().BeTrue();
        route.PathData.Should().Be("M 0 0 H 120");
    }

    [Fact]
    public void Route_prefers_the_candidate_with_fewer_already_routed_crossings()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted =
        [
            [(50, 0, 50, 75)],
        ];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            obstacles: [],
            alreadyRouted);

        DiagramEdgeCrossingCounter.CountAgainst(route.Segments, alreadyRouted).Should().Be(0);
        route.UsedFallback.Should().BeFalse();
    }

    [Fact]
    public void Route_picks_the_smaller_crossing_count_when_both_elbows_clear_obstacles()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted =
        [
            [(50, 25, 50, 75)],
        ];

        DiagramForestOrthogonalEdgeRouter.RouteResult route = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            obstacles: [],
            alreadyRouted);

        DiagramEdgeCrossingCounter.CountAgainst(route.Segments, alreadyRouted).Should().Be(0);
        route.UsedFallback.Should().BeFalse();
    }

    [Fact]
    public void Route_with_extra_vertical_channel_does_not_increase_crossings()
    {
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted =
        [
            [(50, 25, 50, 75)],
        ];

        DiagramForestOrthogonalEdgeRouter.RouteResult baseline = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            obstacles: [],
            alreadyRouted);
        DiagramForestOrthogonalEdgeRouter.RouteResult withChannel = DiagramForestOrthogonalEdgeRouter.Route(
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            obstacles: [],
            alreadyRouted,
            extraVerticalChannelX: 28.0d);

        DiagramEdgeCrossingCounter.CountAgainst(withChannel.Segments, alreadyRouted)
            .Should()
            .BeLessThanOrEqualTo(DiagramEdgeCrossingCounter.CountAgainst(baseline.Segments, alreadyRouted));
    }

    [Fact]
    public void BuildObstacles_excludes_endpoint_nodes()
    {
        List<DiagramResourceGroupPacker.NodePlacementBounds> placements =
        [
            new(
                new Models.DiagramNode { NodeId = "a", Label = "a" },
                0,
                0,
                40,
                20),
            new(
                new Models.DiagramNode { NodeId = "b", Label = "b" },
                120,
                0,
                40,
                20),
            new(
                new Models.DiagramNode { NodeId = "c", Label = "c" },
                60,
                0,
                40,
                20),
        ];

        IReadOnlyList<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
            DiagramForestOrthogonalEdgeRouter.BuildObstacles(placements, "a", "b");

        obstacles.Should().ContainSingle();
        obstacles[0].X.Should().BeApproximately(56.0d, 0.001d);
    }
}
