using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstGraphNodeClassifier
{
    public static string ResolveCategory(GraphNode node)
    {
        string armType = ReadArmType(node);
        string categoryFromArmType = AzureInventoryTopologyCategory.Resolve(armType);

        if (!string.IsNullOrWhiteSpace(node.Category))
        {
            // Older snapshots stamped Microsoft.Network/* as compute before IE-ND-01; trust ARM type for network provider resources.
            if (AzureInventoryTopologyCategory.IsMicrosoftNetworkProviderType(armType)
                && !string.Equals(node.Category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
            {
                return GraphTopologyCategories.Network;
            }

            return node.Category;
        }

        return categoryFromArmType;
    }

    public static string ReadArmId(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
        {
            return armId;
        }

        if (!string.IsNullOrWhiteSpace(node.SourceId))
        {
            return node.SourceId;
        }

        return node.NodeId;
    }

    public static string ReadArmType(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.type", out string? armType) && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType;
    }

    public static string? ReadResourceGroup(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.resourceGroup", out string? resourceGroup) && !string.IsNullOrWhiteSpace(resourceGroup))
        {
            return resourceGroup;
        }

        return TryParseResourceGroupFromArmId(ReadArmId(node));
    }

    public static string? ReadSubscriptionId(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.subscriptionId", out string? subscriptionId) && !string.IsNullOrWhiteSpace(subscriptionId))
        {
            return subscriptionId;
        }

        return TryParseSubscriptionFromArmId(ReadArmId(node));
    }

    public static bool IsTopologyResource(GraphNode node)
    {
        return string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.Ordinal)
            || string.Equals(node.SourceType, "azure-inventory-snapshot", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsExecutiveSummaryNode(GraphNode node)
    {
        string armType = ReadArmType(node);

        if (armType.Contains("/resourcegroups", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (armType.Contains("/virtualnetworks", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (armType.EndsWith("/subscriptions", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string? TryParseResourceGroupFromArmId(string armId)
    {
        const string marker = "/resourcegroups/";

        int index = armId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (index < 0)
        {
            return null;
        }

        int start = index + marker.Length;
        int end = armId.IndexOf('/', start);

        if (end < 0)
        {
            return armId[start..];
        }

        return armId[start..end];
    }

    private static string? TryParseSubscriptionFromArmId(string armId)
    {
        const string marker = "/subscriptions/";

        int index = armId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (index < 0)
        {
            return null;
        }

        int start = index + marker.Length;
        int end = armId.IndexOf('/', start);

        if (end < 0)
        {
            return armId[start..];
        }

        return armId[start..end];
    }
}
