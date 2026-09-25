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
            return TryRoute(to, from, columns, allBounds, toNodeId, fromNodeId, options);
        }

        Dictionary<int, DiagramForestDataFlowColumnLayout.ColumnInfo> columnByIndex = columns
            .ToDictionary(column => column.StageIndex);
        List<DiagramForestOrthogonalEdgeRouter.Rect> obstacles = BuildObstacles(allBounds, fromNodeId, toNodeId);
        double fromCenterY = from.Y + (from.Height / 2.0d);
        double toCenterY = to.Y + (to.Height / 2.0d);
        double fromRightX = from.X + from.Width;
        double toLeftX = to.X;
        int columnDelta = to.ColumnIndex - from.ColumnIndex;

        if (columnDelta == 0)
        {
            return TryRouteSameColumn(from, to, columnByIndex, obstacles, fromCenterY, toCenterY);
        }

        if (columnDelta == 1)
        {
            if (!columnByIndex.TryGetValue(from.ColumnIndex, out DiagramForestDataFlowColumnLayout.ColumnInfo? leftColumn)
                || !columnByIndex.TryGetValue(to.ColumnIndex, out DiagramForestDataFlowColumnLayout.ColumnInfo? rightColumn))
            {
                return null;
            }

            double gutterCenterX = (leftColumn.LeftX + leftColumn.Width + rightColumn.LeftX) / 2.0d;
            List<(double X1, double Y1, double X2, double Y2)> segments =
            [
                (fromRightX, fromCenterY, gutterCenterX, fromCenterY),
                (gutterCenterX, fromCenterY, gutterCenterX, toCenterY),
                (gutterCenterX, toCenterY, toLeftX, toCenterY),
            ];

            return ValidateAndBuild(segments, obstacles);
        }

        if (!columnByIndex.TryGetValue(from.ColumnIndex, out DiagramForestDataFlowColumnLayout.ColumnInfo? sourceColumn)
            || !columnByIndex.TryGetValue(to.ColumnIndex, out DiagramForestDataFlowColumnLayout.ColumnInfo? targetColumn))
        {
            return null;
        }

        if (!columnByIndex.TryGetValue(to.ColumnIndex - 1, out DiagramForestDataFlowColumnLayout.ColumnInfo? columnBeforeTarget))
        {
            return null;
        }

        double targetGutterCenterX = (columnBeforeTarget.LeftX + columnBeforeTarget.Width + targetColumn.LeftX) / 2.0d;
        double skyLaneY = options.Padding + (options.DataFlowSkyLaneHeight / 2.0d);
        List<(double X1, double Y1, double X2, double Y2)> skipSegments =
        [
            (fromRightX, fromCenterY, fromRightX, skyLaneY),
            (fromRightX, skyLaneY, targetGutterCenterX, skyLaneY),
            (targetGutterCenterX, skyLaneY, targetGutterCenterX, toCenterY),
            (targetGutterCenterX, toCenterY, toLeftX, toCenterY),
        ];

        return ValidateAndBuild(skipSegments, obstacles);
    }

    private static DiagramForestOrthogonalEdgeRouter.RouteResult? TryRouteSameColumn(
        DiagramForestDataFlowColumnLayout.NodePlacement from,
        DiagramForestDataFlowColumnLayout.NodePlacement to,
        IReadOnlyDictionary<int, DiagramForestDataFlowColumnLayout.ColumnInfo> columnByIndex,
        IReadOnlyList<DiagramForestOrthogonalEdgeRouter.Rect> obstacles,
        double fromCenterY,
        double toCenterY)
    {
        if (!columnByIndex.TryGetValue(from.ColumnIndex, out DiagramForestDataFlowColumnLayout.ColumnInfo? column))
        {
            return null;
        }

        double laneX = column.LeftX + (column.Width / 2.0d);
        double fromAttachY = fromCenterY <= toCenterY ? from.Y + from.Height : from.Y;
        double toAttachY = fromCenterY <= toCenterY ? to.Y : to.Y + to.Height;
        List<(double X1, double Y1, double X2, double Y2)> segments =
        [
            (laneX, fromAttachY, laneX, toAttachY),
        ];

        return ValidateAndBuild(segments, obstacles);
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
