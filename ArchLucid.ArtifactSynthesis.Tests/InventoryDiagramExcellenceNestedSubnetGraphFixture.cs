using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Minimal dual-subnet graph for nested frame and DOT parity ratchets.</summary>
public static class InventoryDiagramExcellenceNestedSubnetGraphFixture
{
    public static GraphSnapshot Build()
    {
        const string subscriptionId = InventoryDiagramExcellenceSharedGraphFixture.SubscriptionId;
        const string vnetArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(Node("vnet-1", "core-vnet", "Microsoft.Network/virtualNetworks", "network-rg", GraphTopologyCategories.Network));
        graph.Nodes.Add(Node(
            "subnet-a",
            "subnet-a",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            GraphTopologyCategories.Network,
            vnetArmId));
        graph.Nodes.Add(Node(
            "subnet-b",
            "subnet-b",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            GraphTopologyCategories.Network,
            vnetArmId));
        graph.Nodes.Add(Node("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "network-rg", GraphTopologyCategories.Compute));
        graph.Nodes.Add(Node("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "network-rg", GraphTopologyCategories.Compute));
        graph.Nodes.Add(Node("kv-1", "app-kv", "Microsoft.KeyVault/vaults", "network-rg", GraphTopologyCategories.Identity));

        graph.Edges.Add(Placement("vm-a", "subnet-a"));
        graph.Edges.Add(Placement("vm-b", "subnet-b"));
        graph.Edges.Add(CitedEdge("subnet-a", "vnet-1", GraphEdgeTypes.Contains));
        graph.Edges.Add(CitedEdge("subnet-b", "vnet-1", GraphEdgeTypes.Contains));

        return graph;
    }

    private static GraphNode Node(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentArmId = null)
    {
        string armId =
            $"/subscriptions/{InventoryDiagramExcellenceSharedGraphFixture.SubscriptionId}/resourceGroups/{resourceGroup}/providers/{armType}/{label}";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = InventoryDiagramExcellenceSharedGraphFixture.SubscriptionId,
            ["arm.region"] = "eastus",
        };

        if (!string.IsNullOrWhiteSpace(parentArmId))
        {
            properties["arm.parentId"] = parentArmId;
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
        };
    }

    private static GraphEdge Placement(string from, string to)
    {
        return new GraphEdge
        {
            EdgeId = $"{from}-{to}",
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = "in",
            Weight = 1d,
            InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
        };
    }

    private static GraphEdge CitedEdge(string from, string to, string associationType)
    {
        AzureInventoryRelationshipAssociationTypeDefinition? definition =
            AzureInventoryRelationshipAssociationTypes.All
                .FirstOrDefault(item => string.Equals(item.AssociationType, associationType, StringComparison.OrdinalIgnoreCase));

        return new GraphEdge
        {
            EdgeId = $"{from}-{to}",
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = definition?.DefaultGraphEdgeType ?? associationType,
            Weight = 1d,
            InferenceSource = definition?.DefaultInferenceSource ?? GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }
}
