using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestBatchTwoPlannerTests
{
    [Fact]
    public void Connection_rollup_preserves_one_cited_edge()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                new()
                {
                    NodeId = "workflow",
                    Label = "workflow",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/sites",
                    ArmResourceGroup = "rg-app",
                },
                new()
                {
                    NodeId = "connection-a",
                    Label = "Office 365",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/connections",
                    ArmResourceGroup = "rg-app",
                },
                new()
                {
                    NodeId = "connection-b",
                    Label = "Office 365",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/connections",
                    ArmResourceGroup = "rg-app",
                },
            ],
            Edges =
            [
                new() { FromNodeId = "workflow", ToNodeId = "connection-a", Label = "uses" },
                new() { FromNodeId = "workflow", ToNodeId = "connection-b", Label = "uses" },
            ],
        };

        DiagramInventoryConnectionRollupApplier.Apply(ast);

        ast.Nodes.Should().ContainSingle(node => node.Label == "Office 365 (2)");
        ast.Edges.Should().ContainSingle(edge => edge.Label == "uses");
    }

    [Fact]
    public void Singleton_tail_planner_collapses_only_unconnected_singletons()
    {
        List<DiagramNode> nodes =
        [
            new()
            {
                NodeId = "large",
                Label = "large",
                ArmResourceGroup = "rg-large",
                OrderKey = 0,
            },
            new()
            {
                NodeId = "large-2",
                Label = "large-2",
                ArmResourceGroup = "rg-large",
                OrderKey = 1,
            },
        ];

        for (int index = 0; index < 9; index++)
        {
            nodes.Add(new DiagramNode
            {
                NodeId = $"singleton-{index}",
                Label = $"singleton-{index}",
                ArmResourceGroup = $"rg-{index}",
                OrderKey = index + 2,
            });
        }

        DiagramForestSingletonTailPlanner.Result result =
            DiagramForestSingletonTailPlanner.Apply(
                "Azure inventory (FullSubscription)",
                nodes,
                []);

        result.Nodes.Should().ContainSingle(node => node.Label == "Other resource groups (9)");
        result.Nodes.Should().Contain(node => node.NodeId == "large");
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks", 0)]
    [InlineData("Microsoft.Compute/virtualMachines", 1)]
    [InlineData("Microsoft.KeyVault/vaults", 2)]
    [InlineData("Microsoft.Storage/storageAccounts", 3)]
    [InlineData("Microsoft.DataFactory/factories", 4)]
    public void Role_classifier_uses_stable_columns(string armType, int expectedOrder)
    {
        DiagramForestRoleClassifier.ResolveOrder(
            new DiagramNode
            {
                NodeId = "node",
                Label = "node",
                ArmResourceType = armType,
            }).Should().Be(expectedOrder);
    }
}
