using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

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

    public static List<GraphNode> ExcludeSubnets(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => !IsSubnetResource(node))
            .ToList();
    }

    public static List<GraphNode> ExcludeFullSubscriptionNetworkDetails(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => !IsPrivateEndpointResource(node) && !IsFullSubscriptionNetworkDetail(node))
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

    private static bool IsSubnetResource(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

        if (AzureInventoryTopologyCategory.IsSubnetArmType(armType))
        {
            return true;
        }

        return DiagramAstGraphNodeClassifier.ReadArmId(node)
            .Contains("/subnets/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsFullSubscriptionNetworkDetail(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        return ContainsArmToken(armType, armId, "publicIPAddresses")
            || ContainsArmToken(armType, armId, "networkSecurityGroups")
            || ContainsArmToken(armType, armId, "routeTables");
    }

    private static bool ContainsArmToken(string armType, string armId, string token)
    {
        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains(token, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(armId)
            && armId.Contains("/" + token + "/", StringComparison.OrdinalIgnoreCase);
    }
}
