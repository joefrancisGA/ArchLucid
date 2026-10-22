namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Resolves vertical gutter lanes between resource-group frames and card columns for edge routing.</summary>
public static class DiagramForestEdgeGutterChannelResolver
{
    public sealed record PlacementSnapshot(
        double X,
        double Width,
        string? FrameCellId);

    public static IReadOnlyList<double> ResolveVerticalChannels(
        PlacementSnapshot fromPlacement,
        PlacementSnapshot toPlacement,
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> placementBounds,
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> frameBounds,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(fromPlacement);
        ArgumentNullException.ThrowIfNull(toPlacement);
        ArgumentNullException.ThrowIfNull(placementBounds);
        ArgumentNullException.ThrowIfNull(frameBounds);
        ArgumentNullException.ThrowIfNull(options);

        List<double> channels = [];
        double defaultChannelX = fromPlacement.X <= toPlacement.X
            ? fromPlacement.X + fromPlacement.Width + (options.NodeHorizontalGap / 2.0d)
            : fromPlacement.X - (options.NodeHorizontalGap / 2.0d);
        channels.Add(defaultChannelX);

        if (!string.IsNullOrWhiteSpace(fromPlacement.FrameCellId)
            && !string.IsNullOrWhiteSpace(toPlacement.FrameCellId)
            && !string.Equals(fromPlacement.FrameCellId, toPlacement.FrameCellId, StringComparison.Ordinal))
        {
            DiagramResourceGroupPacker.ResourceGroupFrameBounds? fromFrame = frameBounds
                .FirstOrDefault(frame => string.Equals(frame.FrameCellId, fromPlacement.FrameCellId, StringComparison.Ordinal));
            DiagramResourceGroupPacker.ResourceGroupFrameBounds? toFrame = frameBounds
                .FirstOrDefault(frame => string.Equals(frame.FrameCellId, toPlacement.FrameCellId, StringComparison.Ordinal));

            if (fromFrame is not null && toFrame is not null)
            {
                double fromRight = fromFrame.X + fromFrame.Width;
                double toRight = toFrame.X + toFrame.Width;

                if (fromRight <= toFrame.X)
                {
                    channels.Add((fromRight + toFrame.X) / 2.0d);
                }
                else if (toRight <= fromFrame.X)
                {
                    channels.Add((toRight + fromFrame.X) / 2.0d);
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(fromPlacement.FrameCellId)
            && string.Equals(fromPlacement.FrameCellId, toPlacement.FrameCellId, StringComparison.Ordinal))
        {
            channels.AddRange(ResolveIntraFrameColumnGaps(fromPlacement.FrameCellId, placementBounds, options));
        }

        return channels
            .Distinct()
            .OrderBy(channel => Math.Abs(channel - ((fromPlacement.X + toPlacement.X) / 2.0d)))
            .ToList();
    }

    private static IEnumerable<double> ResolveIntraFrameColumnGaps(
        string frameCellId,
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> placementBounds,
        DiagramForestLayoutOptions options)
    {
        List<DiagramResourceGroupPacker.NodePlacementBounds> framePlacements = placementBounds
            .Where(bounds => string.Equals(bounds.FrameCellId, frameCellId, StringComparison.Ordinal))
            .OrderBy(bounds => bounds.X)
            .ThenBy(bounds => bounds.Y)
            .ToList();

        if (framePlacements.Count < 2)
        {
            yield break;
        }

        List<double> columnStarts = [];

        foreach (DiagramResourceGroupPacker.NodePlacementBounds placement in framePlacements)
        {
            if (columnStarts.Count == 0 || placement.X - columnStarts[^1] > options.NodeHorizontalGap)
            {
                columnStarts.Add(placement.X);
            }
        }

        for (int columnIndex = 0; columnIndex < columnStarts.Count - 1; columnIndex++)
        {
            double leftColumnRight = framePlacements
                .Where(placement => Math.Abs(placement.X - columnStarts[columnIndex]) < 0.001d)
                .Max(placement => placement.X + placement.Width);
            double rightColumnLeft = columnStarts[columnIndex + 1];
            yield return (leftColumnRight + rightColumnLeft) / 2.0d;
        }
    }
}
