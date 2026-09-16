using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Network and Full subscription diagrams omit private-endpoint cards.
///     Full subscription still annotates PaaS targets with the lock; Network skips annotation
///     because data-plane nodes are off-canvas.
/// </summary>
internal static class NetworkDiagramNodeFilter
{
    public static List<GraphNode> ExcludePrivateEndpoints(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => !IsPrivateEndpointResource(node))
            .ToList();
    }

    private static bool IsPrivateEndpointResource(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }
}
