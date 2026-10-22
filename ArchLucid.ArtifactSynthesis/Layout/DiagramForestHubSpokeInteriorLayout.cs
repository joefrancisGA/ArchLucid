using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Hub-spoke or vertical-stack placement inside a local coordinate box (IDX-07 / IDX-07b).</summary>
internal static class DiagramForestHubSpokeInteriorLayout
{
    internal sealed record InteriorPlacement(
        DiagramNode Node,
        double LocalX,
        double LocalY,
        double Width,
        double Height,
        DiagramForestNodeMetrics Metrics,
        bool IsHubSpokeHub = false);

    internal sealed record InteriorBounds(
        IReadOnlyList<InteriorPlacement> Placements,
        double Width,
        double Height);

    public static InteriorBounds LayoutComponent(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(labelContext);

        if (DiagramHubSpokeLayerPlanner.ShouldLayoutHubSpoke(component, visibleEdges))
        {
            return LayoutHubSpoke(component, visibleEdges, options, labelContext);
        }

        return LayoutVerticalStack(component, options, labelContext);
    }

    private static InteriorBounds LayoutHubSpoke(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        DiagramNode hub = DiagramHubSpokeLayerPlanner.ResolveHub(component, visibleEdges)
            ?? component.OrderBy(node => node.OrderKey).ThenBy(node => node.NodeId, StringComparer.Ordinal).First();
        IReadOnlyList<DiagramNode> spokes = DiagramHubSpokeLayerPlanner.OrderSpokes(hub, component, visibleEdges);
        List<InteriorPlacement> spokePlacements = [];
        double spokeY = 0.0d;
        double spokeColumnWidth = 0.0d;

        foreach (DiagramNode spoke in spokes)
        {
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(spoke, options, labelContext);
            spokePlacements.Add(new InteriorPlacement(
                spoke,
                0,
                spokeY,
                metrics.Width,
                metrics.Height,
                metrics));
            spokeColumnWidth = Math.Max(spokeColumnWidth, metrics.Width);
            spokeY += metrics.Height + options.NodeVerticalGap;
        }

        DiagramForestNodeMetrics hubMetrics = DiagramForestNodeMetricsCalculator.Measure(hub, options, labelContext);
        double spokeStackHeight = spokeY > 0.0d ? spokeY - options.NodeVerticalGap : hubMetrics.Height;
        double hubY = Math.Max(0.0d, (spokeStackHeight - hubMetrics.Height) / 2.0d);
        double hubX = spokeColumnWidth + options.NodeHorizontalGap;
        List<InteriorPlacement> placements = spokePlacements
            .Select(placement => placement with
            {
                LocalX = (spokeColumnWidth - placement.Width) / 2.0d,
            })
            .ToList();
        placements.Add(new InteriorPlacement(
            hub,
            hubX,
            hubY,
            hubMetrics.Width,
            hubMetrics.Height,
            hubMetrics,
            IsHubSpokeHub: true));

        double width = placements.Max(placement => placement.LocalX + placement.Width);
        double height = placements.Max(placement => placement.LocalY + placement.Height);

        return new InteriorBounds(placements, width, height);
    }

    private static InteriorBounds LayoutVerticalStack(
        IReadOnlyList<DiagramNode> component,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        List<InteriorPlacement> placements = [];
        double nodeY = 0.0d;
        double columnWidth = 0.0d;

        foreach (DiagramNode node in component.OrderBy(n => n.OrderKey).ThenBy(n => n.NodeId, StringComparer.Ordinal))
        {
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(node, options, labelContext);
            placements.Add(new InteriorPlacement(
                node,
                0,
                nodeY,
                metrics.Width,
                metrics.Height,
                metrics));
            columnWidth = Math.Max(columnWidth, metrics.Width);
            nodeY += metrics.Height + options.NodeVerticalGap;
        }

        double height = nodeY > 0.0d ? nodeY - options.NodeVerticalGap : options.NodeHeight;

        return new InteriorBounds(placements, columnWidth, height);
    }
}
