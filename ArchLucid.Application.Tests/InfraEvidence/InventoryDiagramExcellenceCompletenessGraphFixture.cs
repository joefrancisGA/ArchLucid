using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.InfraEvidence;

/// <summary>Vm/nic/subnet graph for IDX-11b completeness excellence ratchets.</summary>
public static class InventoryDiagramExcellenceCompletenessGraphFixture
{
    public static GraphSnapshot BuildVmNicSubnetGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
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
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            GraphTopologyCategories.Network,
            vnetArmId));
        graph.Nodes.Add(Node("nic-1", "app-nic", "Microsoft.Network/networkInterfaces", "network-rg", GraphTopologyCategories.Network));
        graph.Nodes.Add(Node("vm-1", "app-vm", "Microsoft.Compute/virtualMachines", "compute-rg", GraphTopologyCategories.Compute));

        graph.Edges.Add(Edge("vm-1", "nic-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(Edge("nic-1", "subnet-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(Edge("subnet-1", "vnet-1", GraphEdgeTypes.Contains));

        return graph;
    }

    private static GraphNode Node(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentVnetArmId = null)
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

        if (!string.IsNullOrWhiteSpace(parentVnetArmId))
        {
            properties["arm.parentId"] = $"{parentVnetArmId}/subnets/{label}";
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

    private static GraphEdge Edge(string from, string to, string associationType)
    {
        return new GraphEdge
        {
            EdgeId = $"{from}-{to}",
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = associationType,
            Weight = 1d,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }
}
