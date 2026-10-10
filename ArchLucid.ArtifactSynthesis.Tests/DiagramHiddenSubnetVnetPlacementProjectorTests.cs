using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramHiddenSubnetVnetPlacementProjectorTests
{
    [Fact]
    public void Filter_projects_same_group_subnet_placement_to_parent_vnet_before_peel()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        const string subnetArmId = $"{vnetArmId}/subnets/app";

        GraphNode vnet = Node("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        GraphNode subnet = Node("subnet", "Microsoft.Network/virtualNetworks/subnets", subnetArmId);
        GraphNode vm = Node(
            "vm",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app");

        GraphSnapshot filtered = InventoryDiagramGraphPeelFilter.Filter(
            new GraphSnapshot
            {
                Nodes = [vnet, subnet, vm],
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
            },
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Microsoft.Network/virtualNetworks/subnets",
            });

        filtered.Nodes.Should().NotContain(node => node.NodeId == subnet.NodeId);
        filtered.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == vm.NodeId
            && edge.ToNodeId == vnet.NodeId
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement
            && edge.Weight == 1.0d);
    }

    [Fact]
    public void Filter_does_not_project_cross_group_placement()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/hub";

        GraphNode vnet = Node("vnet", "Microsoft.Network/virtualNetworks", vnetArmId, "rg-network");
        GraphNode subnet = Node(
            "subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/app",
            "rg-network");
        GraphNode vm = Node(
            "vm",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app",
            "rg-app");

        GraphSnapshot filtered = InventoryDiagramGraphPeelFilter.Filter(
            new GraphSnapshot
            {
                Nodes = [vnet, subnet, vm],
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
            },
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Microsoft.Network/virtualNetworks/subnets",
            });

        filtered.Edges.Should().BeEmpty();
    }

    private static GraphNode Node(
        string nodeId,
        string armType,
        string armId,
        string resourceGroup = "rg-app")
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
                ["arm.resourceGroup"] = resourceGroup,
            },
        };
    }
}
