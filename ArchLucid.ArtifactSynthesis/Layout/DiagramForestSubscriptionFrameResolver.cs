using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Subscription outer frame for subscription-scoped inventory modes (IDX-06).</summary>
public static class DiagramForestSubscriptionFrameResolver
{
    public static bool ShouldDraw(string title)
    {
        ArgumentNullException.ThrowIfNull(title);

        return DiagramForestInventoryTitleParser.TryParseMode(title, out DiagramMode mode)
            && DiagramForestInventoryTitleParser.IsSubscriptionScopedMode(mode);
    }

    public static DiagramForestNestedFrameBounds? Resolve(
        string title,
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> placements)
    {
        ArgumentNullException.ThrowIfNull(title);
        ArgumentNullException.ThrowIfNull(placements);

        if (!ShouldDraw(title) || placements.Count == 0)
        {
            return null;
        }

        double minX = placements.Min(placement => placement.X);
        double minY = placements.Min(placement => placement.Y);
        double maxX = placements.Max(placement => placement.X + placement.Width);
        double maxY = placements.Max(placement => placement.Y + placement.Height);
        const double pad = 28.0d;
        string label = DiagramForestInventoryTitleParser.ResolveSubscriptionFrameLabel(title);

        return new DiagramForestNestedFrameBounds(
            "subscription",
            label,
            "sub-frame",
            minX - pad,
            minY - pad,
            maxX - minX + (pad * 2.0d),
            maxY - minY + (pad * 2.0d));
    }
}
