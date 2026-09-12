using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramPeelCatalogOrderResolverTests
{
    [Fact]
    public void ResolvePeelOrder_orders_catalog_ranks_before_implicit_child_types()
    {
        DiagramPeelCatalogSnapshot catalog = DiagramPeelCatalogDefaultSeed.BuildSnapshot();

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateNode("Microsoft.Network/networkInterfaces"),
                CreateNode("Microsoft.Network/customChild/widgets"),
            ],
        };

        List<string> order = DiagramPeelCatalogOrderResolver.ResolvePeelOrder(catalog, graph).ToList();

        order.Should().Contain("Microsoft.Network/networkInterfaces");
        order.Should().Contain("Microsoft.Network/customChild/widgets");
        order.IndexOf("Microsoft.Insights/diagnosticSettings").Should().BeLessThan(
            order.IndexOf("Microsoft.Network/customChild/widgets"));
        order.IndexOf("Microsoft.Network/customChild/widgets").Should().BeLessThan(
            order.IndexOf("Microsoft.Network/networkInterfaces"));
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", true)]
    [InlineData("Microsoft.Network/virtualNetworks", false)]
    public void IsImplicitChildArmResourceType_detects_child_arm_types(string armType, bool expected)
    {
        DiagramPeelCatalogOrderResolver.IsImplicitChildArmResourceType(armType).Should().Be(expected);
    }

    private static GraphNode CreateNode(string armType)
    {
        GraphNode node = new()
        {
            NodeId = Guid.NewGuid().ToString("D"),
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armType,
            SourceType = "azure-inventory-snapshot",
        };

        node.Properties["arm.type"] = armType;

        return node;
    }
}
