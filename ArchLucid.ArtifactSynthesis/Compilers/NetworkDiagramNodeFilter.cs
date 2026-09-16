using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Network-mode inventory diagrams omit private-endpoint cards; other modes keep PE annotation behavior.
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
