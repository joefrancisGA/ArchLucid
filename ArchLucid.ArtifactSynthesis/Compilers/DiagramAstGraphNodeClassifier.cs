using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstGraphNodeClassifier
{
    public static bool TryReadStoredArmId(GraphNode node, out string armId)
    {
        if (node.Properties.TryGetValue("arm.id", out string? storedArmId) && !string.IsNullOrWhiteSpace(storedArmId))
        {
            armId = storedArmId;
            return true;
        }

        armId = string.Empty;
        return false;
    }

    public static bool TryReadStoredArmType(GraphNode node, out string armType)
    {
        if (node.Properties.TryGetValue("arm.type", out string? storedArmType) && !string.IsNullOrWhiteSpace(storedArmType))
        {
            armType = storedArmType;
            return true;
        }

        armType = string.Empty;
        return false;
    }

    public static string ResolveCategory(GraphNode node)
    {
        string categoryFromArmType = TryReadStoredArmType(node, out string armType)
            ? AzureInventoryTopologyCategory.Resolve(armType)
            : string.Empty;

        if (!string.IsNullOrWhiteSpace(node.Category))
        {
            // Older snapshots stamped Microsoft.Network/* as compute before IE-ND-01; trust stored ARM type for network provider resources.
            if (TryReadStoredArmType(node, out string storedArmType)
                && AzureInventoryTopologyCategory.IsMicrosoftNetworkProviderType(storedArmType)
                && !string.Equals(node.Category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
            {
                return GraphTopologyCategories.Network;
            }

            return node.Category;
        }

        return string.IsNullOrWhiteSpace(categoryFromArmType)
            ? (node.Category ?? string.Empty)
            : categoryFromArmType;
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

    public static string? ReadKind(GraphNode node)
    {
        if (node.Properties.TryGetValue("kind", out string? kind) && !string.IsNullOrWhiteSpace(kind))
        {
            return kind.Trim();
        }

        return null;
    }

    public static string? ReadResourceGroup(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.resourceGroup", out string? resourceGroup) && !string.IsNullOrWhiteSpace(resourceGroup))
        {
            return resourceGroup;
        }

        return TryParseResourceGroupFromArmId(ReadArmId(node));
    }

    public static string? ReadRegion(GraphNode node)
    {
        if (node.Properties != null
            && node.Properties.TryGetValue("arm.location", out string? location)
            && !string.IsNullOrWhiteSpace(location))
        {
            return location.Trim();
        }

        return null;
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
            || string.Equals(node.SourceType, "azure-inventory-snapshot", StringComparison.OrdinalIgnoreCase)
            || string.Equals(node.SourceType, "azure-inventory-adf-external-source", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsExternalSourceNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId))
        {
            return true;
        }

        return node.Properties != null
            && node.Properties.TryGetValue(
                AzureInventoryAdfExternalSourceNodeFactory.ExternalSourcePropertyKey,
                out string? externalFlag)
            && string.Equals(
                externalFlag,
                AzureInventoryAdfExternalSourceNodeFactory.ExternalSourcePropertyValue,
                StringComparison.OrdinalIgnoreCase);
    }

    public static Guid? ReadCloudResourceId(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (node.Properties != null
            && node.Properties.TryGetValue("cloudResourceId", out string? propertyValue)
            && Guid.TryParse(propertyValue, out Guid propertyId))
        {
            return propertyId;
        }

        if (Guid.TryParse(node.NodeId, out Guid nodeId))
        {
            return nodeId;
        }

        return null;
    }

    public static bool IsExecutiveSummaryNode(GraphNode node)
    {
        string armType = ReadArmType(node);

        if (armType.Contains("/resourcegroups", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(armType))
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
