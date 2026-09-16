using System.Globalization;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Routes forest edges as orthogonal elbows that avoid node bodies.</summary>
public static class DiagramForestOrthogonalEdgeRouter
{
    private const double ObstacleInflation = 4.0d;

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
        List<(double X1, double Y1, double X2, double Y2)> horizontalFirst =
            [
                (fromX, fromY, toX, fromY),
                (toX, fromY, toX, toY),
            ];
        RouteResult? horizontalResult = TryRoute(horizontalFirst, obstacles);

        if (horizontalResult is not null)
        {
            return horizontalResult;
        }

        List<(double X1, double Y1, double X2, double Y2)> verticalFirst =
            [
                (fromX, fromY, fromX, toY),
                (fromX, toY, toX, toY),
            ];
        RouteResult? verticalResult = TryRoute(verticalFirst, obstacles);

        if (verticalResult is not null)
        {
            return verticalResult;
        }

        RouteResult? uRoute = TryThreeSegmentRoute(fromX, fromY, toX, toY, obstacles);

        if (uRoute is not null)
        {
            return uRoute;
        }

        // Last resort: straight chord when orthogonal routing cannot clear obstacles.
        List<(double X1, double Y1, double X2, double Y2)> fallbackSegments = [(fromX, fromY, toX, toY)];

        return new RouteResult(
            BuildPathData(fallbackSegments),
            fallbackSegments,
            UsedFallback: true);
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

    private static RouteResult? TryThreeSegmentRoute(
        double fromX,
        double fromY,
        double toX,
        double toY,
        IReadOnlyList<Rect> obstacles)
    {
        double[] candidateYs = [fromY, toY];
        double[] candidateXs = [fromX, toX];

        foreach (double midY in candidateYs)
        {
            List<(double X1, double Y1, double X2, double Y2)> segments =
                [
                    (fromX, fromY, fromX, midY),
                    (fromX, midY, toX, midY),
                    (toX, midY, toX, toY),
                ];
            RouteResult? result = TryRoute(segments, obstacles);

            if (result is not null)
            {
                return result;
            }
        }

        foreach (double midX in candidateXs)
        {
            List<(double X1, double Y1, double X2, double Y2)> segments =
                [
                    (fromX, fromY, midX, fromY),
                    (midX, fromY, midX, toY),
                    (midX, toY, toX, toY),
                ];
            RouteResult? result = TryRoute(segments, obstacles);

            if (result is not null)
            {
                return result;
            }
        }

        return null;
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
        if (Math.Abs(y1 - y2) < 0.001d)
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

        if (Math.Abs(x1 - x2) < 0.001d)
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

        return false;
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
            if (Math.Abs(y1 - y2) < 0.001d)
            {
                parts.Add(string.Create(CultureInfo.InvariantCulture, $"H {x2:0.###}"));
            }
            else if (Math.Abs(x1 - x2) < 0.001d)
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
