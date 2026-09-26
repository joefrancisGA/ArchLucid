using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Network and Full subscription diagrams omit private-endpoint cards unless the caller opts in.
///     Hidden private endpoints still feed edge analysis (target lock + placement hops).
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

    public static List<GraphNode> ExcludeNetworkInterfaces(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => !DiagramNicOwnerResolver.IsNetworkInterfaceNode(node))
            .ToList();
    }

    private static bool IsPrivateEndpointResource(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("managedPrivateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase)
            && !armId.Contains("/managedPrivateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }
}
