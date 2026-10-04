using System.Globalization;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Routes data-flow edges through column gutters and the sky lane without crossing third cards.</summary>
internal static class DiagramForestDataFlowEdgeRouter
{
    private const double ObstacleInflation = 1.0d;

    public static DiagramForestOrthogonalEdgeRouter.RouteResult? TryRoute(
        DiagramForestDataFlowColumnLayout.NodePlacement from,
        DiagramForestDataFlowColumnLayout.NodePlacement to,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> allBounds,
        string fromNodeId,
        string toNodeId,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(from);
        ArgumentNullException.ThrowIfNull(to);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(allBounds);
        ArgumentNullException.ThrowIfNull(options);

        if (from.ColumnIndex > to.ColumnIndex)
        {
            DiagramForestOrthogonalEdgeRouter.RouteResult? reverseRoute = TryRoute(
                to,
                from,
                columns,
                allBounds,
                toNodeId,
                fromNodeId,
                options);
            return reverseRoute is null ? null : ReverseRoute(reverseRoute);
        }

        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> orderedColumns = columns
            .OrderBy(column => column.LeftX)
            .ToList();
        int fromColumnIndex = FindColumnIndex(orderedColumns, from.ColumnIndex);
        int toColumnIndex = FindColumnIndex(orderedColumns, to.ColumnIndex);
        if (fromColumnIndex < 0 || toColumnIndex < 0)
        {
            return null;
        }
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles = BuildObstacles(allBounds, fromNodeId, toNodeId);
        double fromCenterY = from.Y + (from.Height / 2.0d);
        double toCenterY = to.Y + (to.Height / 2.0d);
        double fromRightX = from.X + from.Width;
        double toLeftX = to.X;
        int columnDelta = toColumnIndex - fromColumnIndex;

        if (columnDelta == 0)
        {
            double laneX = ResolveColumnGutterX(orderedColumns, fromColumnIndex, options);
            return ValidateAndBuild(
                [
                    (fromRightX, fromCenterY, laneX, fromCenterY),
                    (laneX, fromCenterY, laneX, toCenterY),
                    (laneX, toCenterY, toLeftX, toCenterY),
                ],
                obstacles);
        }

        if (columnDelta == 1)
        {
            double gutterCenterX = ResolveColumnGutterX(orderedColumns, fromColumnIndex, options);
            List<(double X1, double Y1, double X2, double Y2)> segments =
            [
                (fromRightX, fromCenterY, gutterCenterX, fromCenterY),
                (gutterCenterX, fromCenterY, gutterCenterX, toCenterY),
                (gutterCenterX, toCenterY, toLeftX, toCenterY),
            ];

            return ValidateAndBuild(segments, obstacles);
        }

        double sourceGutterX = ResolveColumnGutterX(orderedColumns, fromColumnIndex, options);
        double targetGutterX = ResolveColumnGutterX(orderedColumns, toColumnIndex - 1, options);
        double skyLaneY = options.Padding + (options.DataFlowSkyLaneHeight / 2.0d);
        List<(double X1, double Y1, double X2, double Y2)> skipSegments =
        [
            (fromRightX, fromCenterY, sourceGutterX, fromCenterY),
            (sourceGutterX, fromCenterY, sourceGutterX, skyLaneY),
            (sourceGutterX, skyLaneY, targetGutterX, skyLaneY),
            (targetGutterX, skyLaneY, targetGutterX, toCenterY),
            (targetGutterX, toCenterY, toLeftX, toCenterY),
        ];

        return ValidateAndBuild(skipSegments, obstacles);
    }

    private static int FindColumnIndex(
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        int columnIndex)
    {
        for (int index = 0; index < columns.Count; index++)
        {
            if (columns[index].ColumnIndex == columnIndex)
            {
                return index;
            }
        }

        return -1;
    }

    private static double ResolveColumnGutterX(
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        int gutterIndex,
        DiagramForestLayoutOptions options)
    {
        if (gutterIndex < 0)
        {
            return columns[0].LeftX - (options.DataFlowColumnGutter / 2.0d);
        }

        if (gutterIndex >= columns.Count - 1)
        {
            DiagramForestDataFlowColumnLayout.ColumnInfo lastColumn = columns[^1];
            return lastColumn.LeftX + lastColumn.Width + (options.DataFlowColumnGutter / 2.0d);
        }

        DiagramForestDataFlowColumnLayout.ColumnInfo leftColumn = columns[gutterIndex];
        DiagramForestDataFlowColumnLayout.ColumnInfo rightColumn = columns[gutterIndex + 1];
        return (leftColumn.LeftX + leftColumn.Width + rightColumn.LeftX) / 2.0d;
    }

    private static DiagramForestOrthogonalEdgeRouter.RouteResult? ValidateAndBuild(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        IReadOnlyList<DiagramForestOrthogonalEdgeRouter.Rect> obstacles)
    {
        foreach ((double x1, double y1, double x2, double y2) in segments)
        {
            if (SegmentInteriorHitsObstacle(x1, y1, x2, y2, obstacles))
            {
                return null;
            }
        }

        return new DiagramForestOrthogonalEdgeRouter.RouteResult(
            BuildPathData(segments),
            segments,
            UsedFallback: false);
    }

    private static DiagramForestOrthogonalEdgeRouter.RouteResult ReverseRoute(
        DiagramForestOrthogonalEdgeRouter.RouteResult route)
    {
        List<(double X1, double Y1, double X2, double Y2)> segments = route.Segments
            .Reverse()
            .Select(segment => (segment.X2, segment.Y2, segment.X1, segment.Y1))
            .ToList();
        return new DiagramForestOrthogonalEdgeRouter.RouteResult(
            BuildPathData(segments),
            segments,
            route.UsedFallback);
    }

    private static List<DiagramForestOrthogonalEdgeRouter.Rect> BuildObstacles(
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> allBounds,
        string fromNodeId,
        string toNodeId)
    {
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles = [];

        foreach (DiagramResourceGroupPacker.NodePlacementBounds bounds in allBounds)
        {
            if (string.Equals(bounds.Node.NodeId, fromNodeId, StringComparison.Ordinal)
                || string.Equals(bounds.Node.NodeId, toNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            obstacles.Add(new DiagramForestOrthogonalEdgeRouter.Rect(
                bounds.X - ObstacleInflation,
                bounds.Y - ObstacleInflation,
                bounds.Width + (ObstacleInflation * 2.0d),
                bounds.Height + (ObstacleInflation * 2.0d)));
        }

        return obstacles;
    }

    private static bool SegmentInteriorHitsObstacle(
        double x1,
        double y1,
        double x2,
        double y2,
        IReadOnlyList<DiagramForestOrthogonalEdgeRouter.Rect> obstacles)
    {
        for (double t = 0.1d; t <= 0.9d; t += 0.1d)
        {
            double px = x1 + (t * (x2 - x1));
            double py = y1 + (t * (y2 - y1));

            foreach (DiagramForestOrthogonalEdgeRouter.Rect obstacle in obstacles)
            {
                if (PointInRectInterior(px, py, obstacle))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool PointInRectInterior(
        double x,
        double y,
        DiagramForestOrthogonalEdgeRouter.Rect rect)
    {
        return x > rect.X && x < rect.X + rect.Width && y > rect.Y && y < rect.Y + rect.Height;
    }

    private static string BuildPathData(IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments)
    {
        if (segments.Count == 0)
        {
            return string.Empty;
        }

        (double x1, double y1, _, _) = segments[0];
        List<string> parts = [$"M {Format(x1)} {Format(y1)}"];

        foreach ((_, _, double x2, double y2) in segments)
        {
            parts.Add($"L {Format(x2)} {Format(y2)}");
        }

        return string.Join(' ', parts);
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
