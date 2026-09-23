using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Resolves the subscription-level page frame for subscription-scoped inventory views.</summary>
public static class DiagramForestSubscriptionFrameResolver
{
    public static bool ShouldDraw(string title)
    {
        ArgumentNullException.ThrowIfNull(title);

        return title.Contains("Azure inventory", StringComparison.OrdinalIgnoreCase)
            && !title.Contains("(ResourceGroup)", StringComparison.OrdinalIgnoreCase)
            && !title.Contains("(SelectedResources)", StringComparison.OrdinalIgnoreCase)
            && !title.Contains("(DependencyNeighborhood)", StringComparison.OrdinalIgnoreCase);
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

        return new DiagramForestNestedFrameBounds(
            "subscription",
            "Subscription",
            "subscription-frame",
            minX - pad,
            minY - pad,
            maxX - minX + (pad * 2.0d),
            maxY - minY + (pad * 2.0d));
    }
}
