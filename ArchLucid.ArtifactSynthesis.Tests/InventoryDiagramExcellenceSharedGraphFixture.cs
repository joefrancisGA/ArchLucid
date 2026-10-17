using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Shared inventory graph for IDX-13 cross-mode ratchet tests.</summary>
public static class InventoryDiagramExcellenceSharedGraphFixture
{
    public const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    public static GraphSnapshot BuildFatGraph()
    {
        const string vnetArmId =
            $"/subscriptions/{SubscriptionId}/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateTopologyNode(
            "vnet-1",
            "core-vnet",
            "Microsoft.Network/virtualNetworks",
            "network-rg",
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            GraphTopologyCategories.Network,
            parentArmId: vnetArmId));
        graph.Nodes.Add(CreateTopologyNode(
            "nic-1",
            "app-nic",
            "Microsoft.Network/networkInterfaces",
            "network-rg",
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "vm-1",
            "app-vm",
            "Microsoft.Compute/virtualMachines",
            "compute-rg",
            GraphTopologyCategories.Compute));
        graph.Nodes.Add(CreateTopologyNode(
            "pe-1",
            "pe-kv",
            "Microsoft.Network/privateEndpoints",
            "network-rg",
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "kv-1",
            "app-kv",
            "Microsoft.KeyVault/vaults",
            "compute-rg",
            GraphTopologyCategories.Identity));
        graph.Nodes.Add(CreateTopologyNode(
            "storage-1",
            "logs",
            "Microsoft.Storage/storageAccounts",
            "data-rg",
            GraphTopologyCategories.Storage));
        graph.Nodes.Add(CreateTopologyNode(
            "identity-1",
            "app-id",
            "Microsoft.ManagedIdentity/userAssignedIdentities",
            "compute-rg",
            GraphTopologyCategories.Identity));
        graph.Nodes.Add(CreateTopologyNode(
            "singleton-rg-vm",
            "lonely-vm",
            "Microsoft.Compute/virtualMachines",
            "singleton-rg",
            GraphTopologyCategories.Compute));
        graph.Nodes.Add(CreateTopologyNode(
            "other-rg-vm",
            "noise-vm",
            "Microsoft.Compute/virtualMachines",
            "noise-rg",
            GraphTopologyCategories.Compute));

        graph.Edges.Add(CitedEdge("vm-1", "nic-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("nic-1", "subnet-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("subnet-1", "vnet-1", GraphEdgeTypes.Contains));
        graph.Edges.Add(CitedEdge("pe-1", "subnet-1", AzureInventoryRelationshipAssociationTypes.PeToSubnet));

        return graph;
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

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentArmId = null)
    {
        string armId =
            $"/subscriptions/{SubscriptionId}/resourceGroups/{resourceGroup}/providers/{armType}/{label}";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = SubscriptionId,
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
}
