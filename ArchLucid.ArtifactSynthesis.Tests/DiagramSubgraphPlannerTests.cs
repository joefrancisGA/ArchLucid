using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramSubgraphPlannerTests
{
    [Fact]
    public void PlanSubgraphs_labels_missing_vnet_name_with_arm_segment_fallback()
    {
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub-vnet";
        DiagramSubgraphPlanner planner = new();
        IReadOnlyList<GraphNode> nodes =
        [
            CreateSubnetNode("subnet-1", vnetArmId, label: null!),
        ];

        IReadOnlyList<DiagramSubgraph> subgraphs = planner.PlanSubgraphs(nodes);

        subgraphs.Should().ContainSingle(subgraph => subgraph.Label == "VNet hub-vnet (ARM segment)");
    }

    [Fact]
    public void PlanSubgraphs_labels_empty_vnet_name_without_arm_segment_guess()
    {
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub-vnet";
        DiagramSubgraphPlanner planner = new();
        IReadOnlyList<GraphNode> nodes =
        [
            CreateVnetNode(vnetArmId, string.Empty),
            CreateSubnetNode("subnet-1", vnetArmId, label: "app-subnet"),
        ];

        IReadOnlyList<DiagramSubgraph> subgraphs = planner.PlanSubgraphs(nodes);

        subgraphs.Should().ContainSingle(subgraph => subgraph.Label == "VNet Virtual network name was stored empty.");
    }

    [Fact]
    public void PlanSubgraphs_labels_whitespace_subnet_name_as_stored_empty()
    {
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub-vnet";
        DiagramSubgraphPlanner planner = new();
        IReadOnlyList<GraphNode> nodes =
        [
            CreateVnetNode(vnetArmId, "hub-vnet"),
            CreateSubnetNode("subnet-empty", vnetArmId, label: "   "),
        ];

        IReadOnlyList<DiagramSubgraph> subgraphs = planner.PlanSubgraphs(nodes);

        subgraphs.Should().Contain(subgraph => subgraph.Label == "Subnet name was stored empty.");
    }

    private static GraphNode CreateVnetNode(string armId, string label)
    {
        return new GraphNode
        {
            NodeId = armId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.Network/virtualNetworks",
                ["arm.subscriptionId"] = "sub",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphNode CreateSubnetNode(string nodeId, string parentArmId, string? label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label ?? string.Empty,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = $"{parentArmId}/subnets/{nodeId}",
                ["arm.type"] = "Microsoft.Network/virtualNetworks/subnets",
                ["arm.parentId"] = parentArmId,
                ["arm.subscriptionId"] = "sub",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
