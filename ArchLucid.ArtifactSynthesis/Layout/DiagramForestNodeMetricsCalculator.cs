using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramForestNodeMetricsCalculator
{
    public static DiagramForestNodeMetrics Measure(
        DiagramNode node,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(labelContext);

        return labelContext.Measure(node);
    }
}
