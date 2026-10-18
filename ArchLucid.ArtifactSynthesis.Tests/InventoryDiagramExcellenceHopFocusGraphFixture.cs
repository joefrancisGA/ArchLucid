using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Vm/nic/subnet/vnet graph for IDX-12b hop-focus excellence ratchets.</summary>
public static class InventoryDiagramExcellenceHopFocusGraphFixture
{
    public static GraphSnapshot BuildVmNicSubnetVnetGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string vnetArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/core-vnet";
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateNode("vnet", "core-vnet", "Microsoft.Network/virtualNetworks", "rg-net", GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateNode(
            "subnet",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "rg-net",
            GraphTopologyCategories.Network,
            parentArmId: vnetArmId));
        graph.Nodes.Add(CreateNode("nic", "app-nic", "Microsoft.Network/networkInterfaces", "rg-net", GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateNode("vm", "app-vm", "Microsoft.Compute/virtualMachines", "rg-app", GraphTopologyCategories.Compute));

        graph.Edges.Add(CitedEdge("vm", "nic", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("nic", "subnet", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("subnet", "vnet", GraphEdgeTypes.Contains));

        return graph;
    }

    public static GraphNode CreateUnrelatedVmNode()
    {
        return CreateNode(
            "other-vm",
            "other-vm",
            "Microsoft.Compute/virtualMachines",
            "rg-other",
            GraphTopologyCategories.Compute);
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

    private static GraphNode CreateNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentArmId = null)
    {
        string armId = $"/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/{resourceGroup}/providers/{armType}/{label}";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = "11111111-1111-1111-1111-111111111111",
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
