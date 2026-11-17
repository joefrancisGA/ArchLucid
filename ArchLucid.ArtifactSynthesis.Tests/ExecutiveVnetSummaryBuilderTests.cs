using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class ExecutiveVnetSummaryBuilderTests
{
    [Fact]
    public void ApplyExecutiveVnetLabels_counts_subnet_when_parent_derived_from_arm_id()
    {
        GraphNode vnet = Node(
            "vnet-1",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet",
            "Microsoft.Network/virtualNetworks");
        GraphNode subnet = Node(
            "subnet-1",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet/subnets/app",
            "Microsoft.Network/virtualNetworks/subnets");

        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    SeedNodeId = "vnet-1",
                    NodeId = "vnet-1",
                    Label = "core-vnet",
                    NodeType = "VirtualNetwork",
                },
            ],
        };

        GraphSnapshot graph = new() { Nodes = [vnet, subnet] };

        ExecutiveVnetSummaryBuilder.ApplyExecutiveVnetLabels(ast, graph, [vnet, subnet]);

        ast.Nodes[0].Label.Should().Contain("1 subnet");
    }

    private static GraphNode Node(string nodeId, string armId, string armType) => new()
    {
        NodeId = nodeId,
        Label = nodeId,
        Properties = new Dictionary<string, string>
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
        },
    };
}
