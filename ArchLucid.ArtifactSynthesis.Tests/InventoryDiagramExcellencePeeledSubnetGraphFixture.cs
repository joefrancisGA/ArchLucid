using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Vm/subnet/vnet graph for IDX-05b peeled-subnet excellence ratchets.</summary>
public static class InventoryDiagramExcellencePeeledSubnetGraphFixture
{
    public static GraphSnapshot PeelSubnetsFrom(GraphSnapshot graph)
    {
        return InventoryDiagramGraphPeelFilter.Filter(
            graph,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Microsoft.Network/virtualNetworks/subnets",
            });
    }

    public static GraphSnapshot BuildSameGroupVmSubnetGraph()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        const string subnetArmId = $"{vnetArmId}/subnets/app";

        GraphNode vnet = TopologyNode("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        GraphNode subnet = TopologyNode("subnet", "Microsoft.Network/virtualNetworks/subnets", subnetArmId);
        GraphNode vm = TopologyNode(
            "vm",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app");
        GraphNode vault = TopologyNode(
            "vault",
            "Microsoft.KeyVault/vaults",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.KeyVault/vaults/app");

        return new GraphSnapshot
        {
            Nodes = [vnet, subnet, vm, vault],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "vm-subnet",
                    FromNodeId = vm.NodeId,
                    ToNodeId = subnet.NodeId,
                    EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    Weight = 1.0d,
                    InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                },
            ],
        };
    }

    public static GraphSnapshot BuildDualSubnetPeelGraph()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";

        GraphNode vnet = TopologyNode("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        GraphNode subnetA = TopologyNode(
            "subnet-a",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/a");
        GraphNode subnetB = TopologyNode(
            "subnet-b",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/b");
        GraphNode vmA = TopologyNode(
            "vm-a",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/a");
        GraphNode vmB = TopologyNode(
            "vm-b",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/b");

        return new GraphSnapshot
        {
            Nodes = [vnet, subnetA, subnetB, vmA, vmB],
            Edges =
            [
                PlacementEdge("vm-a", "subnet-a"),
                PlacementEdge("vm-b", "subnet-b"),
            ],
        };
    }

    private static GraphEdge PlacementEdge(string fromNodeId, string toSubnetNodeId)
    {
        return new GraphEdge
        {
            EdgeId = $"{fromNodeId}-{toSubnetNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toSubnetNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }

    private static GraphNode TopologyNode(string nodeId, string armType, string armId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceId = armId,
            Properties =
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg-app",
            },
        };
    }
}
