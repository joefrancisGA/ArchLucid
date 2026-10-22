using System.Globalization;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Routes forest edges as axis-aligned straight chords when clear, otherwise orthogonal elbows that avoid node bodies.</summary>
public static class DiagramForestOrthogonalEdgeRouter
{
    private const double ObstacleInflation = 4.0d;
    private const double AxisEpsilon = 0.001d;

    public sealed record RouteResult(
        string PathData,
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> Segments,
        bool UsedFallback);

    public sealed record Rect(double X, double Y, double Width, double Height);

    public static RouteResult Route(
        double fromX,
        double fromY,
        double toX,
        double toY,
        IReadOnlyList<Rect> obstacles)
    {
        return Route(fromX, fromY, toX, toY, obstacles, []);
    }

    public static RouteResult Route(
        double fromX,
        double fromY,
        double toX,
        double toY,
        IReadOnlyList<Rect> obstacles,
        IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted,
        double? extraVerticalChannelX = null,
        IReadOnlyList<double>? gutterVerticalChannelXs = null)
    {
        ArgumentNullException.ThrowIfNull(obstacles);
        ArgumentNullException.ThrowIfNull(alreadyRouted);

        List<double> gutterChannelXs = CollectGutterChannelXs(extraVerticalChannelX, gutterVerticalChannelXs);
        List<RouteCandidate> candidates = BuildCandidates(
            fromX,
            fromY,
            toX,
            toY,
            gutterChannelXs,
            obstacles);

        RouteResult? bestClearRoute = SelectBestClearRoute(candidates, obstacles, alreadyRouted);

        if (bestClearRoute is not null)
        {
            return bestClearRoute;
        }

        RouteResult? bestScoredRoute = SelectBestScoredRoute(candidates, obstacles, alreadyRouted);

        if (bestScoredRoute is not null)
        {
            return bestScoredRoute;
        }

        List<(double X1, double Y1, double X2, double Y2)> fallbackSegments = candidates[0].Segments;

        if (IsAxisAligned(fromX, fromY, toX, toY))
        {
            fallbackSegments = [(fromX, fromY, toX, toY)];
        }

        return new RouteResult(
            BuildPathData(fallbackSegments),
            fallbackSegments,
            UsedFallback: CountObstacleIntersections(fallbackSegments, obstacles) > 0);
    }

    private static List<double> CollectGutterChannelXs(
        double? extraVerticalChannelX,
        IReadOnlyList<double>? gutterVerticalChannelXs)
    {
        List<double> channelXs = [];

        if (extraVerticalChannelX is double channelX)
        {
            channelXs.Add(channelX);
        }

        if (gutterVerticalChannelXs is not null)
        {
            channelXs.AddRange(gutterVerticalChannelXs);
        }

        return channelXs
            .Distinct()
            .ToList();
    }

    private sealed record RouteCandidate(
        List<(double X1, double Y1, double X2, double Y2)> Segments,
        bool IsGutter);

    private static List<RouteCandidate> BuildCandidates(
        double fromX,
        double fromY,
        double toX,
        double toY,
        IReadOnlyList<double> gutterChannelXs,
        IReadOnlyList<Rect> obstacles)
    {
        List<RouteCandidate> candidates = [];
        List<(double X1, double Y1, double X2, double Y2)> straightSegments = [(fromX, fromY, toX, toY)];

        if (IsAxisAligned(fromX, fromY, toX, toY))
        {
            candidates.Add(new RouteCandidate(straightSegments, IsGutter: false));
        }

        candidates.Add(new RouteCandidate(
            [
                (fromX, fromY, toX, fromY),
                (toX, fromY, toX, toY),
            ],
            IsGutter: false));
        candidates.Add(new RouteCandidate(
            [
                (fromX, fromY, fromX, toY),
                (fromX, toY, toX, toY),
            ],
            IsGutter: false));
        candidates.AddRange(CollectThreeSegmentCandidates(fromX, fromY, toX, toY)
            .Select(segments => new RouteCandidate(segments, IsGutter: false)));

        IReadOnlyList<double> bypassYs = CollectBypassYCandidates(fromY, toY, obstacles);

        foreach (double channelX in gutterChannelXs)
        {
            List<(double X1, double Y1, double X2, double Y2)> gutterSegments =
                BuildGutterChannelSegments(fromX, fromY, toX, toY, channelX);
            candidates.Add(new RouteCandidate(gutterSegments, IsGutter: true));

            if (TryRoute(gutterSegments, obstacles) is not null)
            {
                continue;
            }

            foreach (double bypassY in bypassYs)
            {
                if (Math.Abs(bypassY - fromY) < AxisEpsilon && Math.Abs(bypassY - toY) < AxisEpsilon)
                {
                    continue;
                }

                candidates.Add(new RouteCandidate(
                    BuildGutterBypassSegments(fromX, fromY, toX, toY, channelX, bypassY),
                    IsGutter: true));
            }
        }

        return candidates;
    }

    private static IReadOnlyList<double> CollectBypassYCandidates(
        double fromY,
        double toY,
        IReadOnlyList<Rect> obstacles)
    {
        HashSet<double> bypassYs = [fromY, toY];

        foreach (Rect obstacle in obstacles)
        {
            bypassYs.Add(obstacle.Y - ObstacleInflation);
            bypassYs.Add(obstacle.Y + obstacle.Height + ObstacleInflation);
        }

        return bypassYs.ToList();
    }

    private static List<(double X1, double Y1, double X2, double Y2)> BuildGutterChannelSegments(
        double fromX,
        double fromY,
        double toX,
        double toY,
        double channelX)
    {
        return
        [
            (fromX, fromY, channelX, fromY),
            (channelX, fromY, channelX, toY),
            (channelX, toY, toX, toY),
        ];
    }

    private static List<(double X1, double Y1, double X2, double Y2)> BuildGutterBypassSegments(
        double fromX,
        double fromY,
        double toX,
        double toY,
        double channelX,
        double bypassY)
    {
        if (Math.Abs(bypassY - fromY) < AxisEpsilon && Math.Abs(bypassY - toY) < AxisEpsilon)
        {
            return BuildGutterChannelSegments(fromX, fromY, toX, toY, channelX);
        }

        return
        [
            (fromX, fromY, fromX, bypassY),
            (fromX, bypassY, channelX, bypassY),
            (channelX, bypassY, toX, bypassY),
            (toX, bypassY, toX, toY),
        ];
    }

    private static RouteResult? SelectBestClearRoute(
        IReadOnlyList<RouteCandidate> candidates,
        IReadOnlyList<Rect> obstacles,
        IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted)
    {
        RouteResult? bestRoute = null;
        int bestCrossings = int.MaxValue;
        bool bestIsGutter = false;

        foreach (RouteCandidate candidate in candidates)
        {
            RouteResult? candidateRoute = TryRoute(candidate.Segments, obstacles);

            if (candidateRoute is null)
            {
                continue;
            }

            int crossings = DiagramEdgeCrossingCounter.CountAgainst(candidate.Segments, alreadyRouted);

            if (crossings < bestCrossings)
            {
                bestCrossings = crossings;
                bestRoute = candidateRoute;
                bestIsGutter = candidate.IsGutter;
                continue;
            }

            if (crossings == bestCrossings && candidate.IsGutter && !bestIsGutter)
            {
                bestRoute = candidateRoute;
                bestIsGutter = true;
            }
        }

        return bestRoute;
    }

    private static RouteResult? SelectBestScoredRoute(
        IReadOnlyList<RouteCandidate> candidates,
        IReadOnlyList<Rect> obstacles,
        IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted)
    {
        List<(double X1, double Y1, double X2, double Y2)>? bestSegments = null;
        int bestObstacleHits = int.MaxValue;
        int bestCrossings = int.MaxValue;
        bool bestIsGutter = false;

        foreach (RouteCandidate candidate in candidates)
        {
            int obstacleHits = CountObstacleIntersections(candidate.Segments, obstacles);
            int crossings = DiagramEdgeCrossingCounter.CountAgainst(candidate.Segments, alreadyRouted);

            if (candidate.IsGutter && !bestIsGutter)
            {
                bestSegments = candidate.Segments;
                bestObstacleHits = obstacleHits;
                bestCrossings = crossings;
                bestIsGutter = true;
                continue;
            }

            if (candidate.IsGutter != bestIsGutter)
            {
                continue;
            }

            if (obstacleHits < bestObstacleHits
                || (obstacleHits == bestObstacleHits && crossings < bestCrossings))
            {
                bestSegments = candidate.Segments;
                bestObstacleHits = obstacleHits;
                bestCrossings = crossings;
            }
        }

        if (bestSegments is null)
        {
            return null;
        }

        return new RouteResult(
            BuildPathData(bestSegments),
            bestSegments,
            UsedFallback: bestObstacleHits > 0);
    }

    private static int CountObstacleIntersections(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        IReadOnlyList<Rect> obstacles)
    {
        int hits = 0;

        foreach ((double x1, double y1, double x2, double y2) in segments)
        {
            foreach (Rect obstacle in obstacles)
            {
                if (SegmentIntersectsRectInterior(x1, y1, x2, y2, obstacle))
                {
                    hits++;
                }
            }
        }

        return hits;
    }

    private static List<List<(double X1, double Y1, double X2, double Y2)>> CollectThreeSegmentCandidates(
        double fromX,
        double fromY,
        double toX,
        double toY)
    {
        List<List<(double X1, double Y1, double X2, double Y2)>> candidates = [];
        double[] candidateYs = [fromY, toY];
        double[] candidateXs = [fromX, toX];

        foreach (double midY in candidateYs)
        {
            candidates.Add(
                [
                    (fromX, fromY, fromX, midY),
                    (fromX, midY, toX, midY),
                    (toX, midY, toX, toY),
                ]);
        }

        foreach (double midX in candidateXs)
        {
            candidates.Add(
                [
                    (fromX, fromY, midX, fromY),
                    (midX, fromY, midX, toY),
                    (midX, toY, toX, toY),
                ]);
        }

        return candidates;
    }

    public static IReadOnlyList<Rect> BuildObstacles(
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> placements,
        string fromNodeId,
        string toNodeId)
    {
        List<Rect> obstacles = [];

        foreach (DiagramResourceGroupPacker.NodePlacementBounds placement in placements)
        {
            if (string.Equals(placement.Node.NodeId, fromNodeId, StringComparison.Ordinal)
                || string.Equals(placement.Node.NodeId, toNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            obstacles.Add(new Rect(
                placement.X - ObstacleInflation,
                placement.Y - ObstacleInflation,
                placement.Width + (ObstacleInflation * 2.0d),
                placement.Height + (ObstacleInflation * 2.0d)));
        }

        return obstacles;
    }

    private static bool IsAxisAligned(double fromX, double fromY, double toX, double toY)
    {
        return Math.Abs(fromY - toY) < AxisEpsilon || Math.Abs(fromX - toX) < AxisEpsilon;
    }

    private static RouteResult? TryRoute(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        IReadOnlyList<Rect> obstacles)
    {
        foreach ((double x1, double y1, double x2, double y2) in segments)
        {
            if (SegmentIntersectsAnyObstacle(x1, y1, x2, y2, obstacles))
            {
                return null;
            }
        }

        return new RouteResult(BuildPathData(segments), segments, UsedFallback: false);
    }

    private static bool SegmentIntersectsAnyObstacle(
        double x1,
        double y1,
        double x2,
        double y2,
        IReadOnlyList<Rect> obstacles)
    {
        foreach (Rect obstacle in obstacles)
        {
            if (SegmentIntersectsRectInterior(x1, y1, x2, y2, obstacle))
            {
                return true;
            }
        }

        return false;
    }

    private static bool SegmentIntersectsRectInterior(double x1, double y1, double x2, double y2, Rect rect)
    {
        if (Math.Abs(y1 - y2) < AxisEpsilon)
        {
            double y = y1;
            double minX = Math.Min(x1, x2);
            double maxX = Math.Max(x1, x2);

            if (y <= rect.Y || y >= rect.Y + rect.Height)
            {
                return false;
            }

            return maxX > rect.X && minX < rect.X + rect.Width;
        }

        if (Math.Abs(x1 - x2) < AxisEpsilon)
        {
            double x = x1;
            double minY = Math.Min(y1, y2);
            double maxY = Math.Max(y1, y2);

            if (x <= rect.X || x >= rect.X + rect.Width)
            {
                return false;
            }

            return maxY > rect.Y && minY < rect.Y + rect.Height;
        }

        if (PointStrictlyInsideRect(x1, y1, rect) || PointStrictlyInsideRect(x2, y2, rect))
        {
            return true;
        }

        return SegmentCrossesRectInteriorAlongDiagonal(x1, y1, x2, y2, rect);
    }

    private static bool SegmentCrossesRectInteriorAlongDiagonal(
        double x1,
        double y1,
        double x2,
        double y2,
        Rect rect)
    {
        double rectRight = rect.X + rect.Width;
        double rectBottom = rect.Y + rect.Height;

        for (int step = 1; step < 4; step++)
        {
            double t = step / 4.0d;
            double sampleX = x1 + (t * (x2 - x1));
            double sampleY = y1 + (t * (y2 - y1));

            if (PointStrictlyInsideRect(sampleX, sampleY, rect))
            {
                return true;
            }
        }

        return SegmentsIntersect(x1, y1, x2, y2, rect.X, rect.Y, rectRight, rect.Y)
            || SegmentsIntersect(x1, y1, x2, y2, rectRight, rect.Y, rectRight, rectBottom)
            || SegmentsIntersect(x1, y1, x2, y2, rectRight, rectBottom, rect.X, rectBottom)
            || SegmentsIntersect(x1, y1, x2, y2, rect.X, rectBottom, rect.X, rect.Y);
    }

    private static bool PointStrictlyInsideRect(double x, double y, Rect rect)
    {
        return x > rect.X
            && x < rect.X + rect.Width
            && y > rect.Y
            && y < rect.Y + rect.Height;
    }

    private static bool SegmentsIntersect(
        double ax1,
        double ay1,
        double ax2,
        double ay2,
        double bx1,
        double by1,
        double bx2,
        double by2)
    {
        double orientationA = Orient(ax1, ay1, ax2, ay2, bx1, by1);
        double orientationB = Orient(ax1, ay1, ax2, ay2, bx2, by2);
        double orientationC = Orient(bx1, by1, bx2, by2, ax1, ay1);
        double orientationD = Orient(bx1, by1, bx2, by2, ax2, ay2);

        if (orientationA > 0.0d && orientationB < 0.0d && orientationC > 0.0d && orientationD < 0.0d)
        {
            return true;
        }

        if (orientationA < 0.0d && orientationB > 0.0d && orientationC < 0.0d && orientationD > 0.0d)
        {
            return true;
        }

        if (Math.Abs(orientationA) < AxisEpsilon
            && PointOnSegment(bx1, by1, ax1, ay1, ax2, ay2))
        {
            return true;
        }

        if (Math.Abs(orientationB) < AxisEpsilon
            && PointOnSegment(bx2, by2, ax1, ay1, ax2, ay2))
        {
            return true;
        }

        if (Math.Abs(orientationC) < AxisEpsilon
            && PointOnSegment(ax1, ay1, bx1, by1, bx2, by2))
        {
            return true;
        }

        if (Math.Abs(orientationD) < AxisEpsilon
            && PointOnSegment(ax2, ay2, bx1, by1, bx2, by2))
        {
            return true;
        }

        return false;
    }

    private static double Orient(double px, double py, double qx, double qy, double rx, double ry)
    {
        return ((qy - py) * (rx - qx)) - ((qx - px) * (ry - qy));
    }

    private static bool PointOnSegment(double px, double py, double x1, double y1, double x2, double y2)
    {
        return px >= Math.Min(x1, x2) - AxisEpsilon
            && px <= Math.Max(x1, x2) + AxisEpsilon
            && py >= Math.Min(y1, y2) - AxisEpsilon
            && py <= Math.Max(y1, y2) + AxisEpsilon;
    }

    private static string BuildPathData(IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments)
    {
        if (segments.Count == 0)
        {
            return string.Empty;
        }

        (double startX, double startY, _, _) = segments[0];
        List<string> parts = [string.Create(CultureInfo.InvariantCulture, $"M {startX:0.###} {startY:0.###}")];

        foreach ((double x1, double y1, double x2, double y2) in segments)
        {
            if (Math.Abs(y1 - y2) < AxisEpsilon)
            {
                parts.Add(string.Create(CultureInfo.InvariantCulture, $"H {x2:0.###}"));
            }
            else if (Math.Abs(x1 - x2) < AxisEpsilon)
            {
                parts.Add(string.Create(CultureInfo.InvariantCulture, $"V {y2:0.###}"));
            }
            else
            {
                parts.Add(string.Create(CultureInfo.InvariantCulture, $"L {x2:0.###} {y2:0.###}"));
            }
        }

        return string.Join(" ", parts);
    }
}
