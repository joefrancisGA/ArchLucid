using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramNeighborhoodSeedResolverTests
{
    [Fact]
    public void TryResolveGraphNodeId_empty_seed_returns_null()
    {
        List<GraphNode> nodes = [CreateNode("vnet-1", "core-vnet")];

        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, "  ").Should().BeNull();
        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, null).Should().BeNull();
    }

    [Fact]
    public void TryResolveGraphNodeId_matches_node_id_arm_id_label_and_mermaid_hash()
    {
        Guid cloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        GraphNode guidNode = CreateNode(
            cloudResourceId.ToString("D"),
            "vnet-aep-hi-test-wus-001",
            cloudResourceId: cloudResourceId);
        GraphNode simpleNode = CreateNode("vnet-1", "core-vnet");
        List<GraphNode> nodes = [guidNode, simpleNode];

        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, cloudResourceId.ToString("D"))
            .Should()
            .Be(guidNode.NodeId);
        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, guidNode.Properties["arm.id"])
            .Should()
            .Be(guidNode.NodeId);
        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, "vnet-aep-hi-test-wus-001")
            .Should()
            .Be(guidNode.NodeId);
        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, MermaidIdSanitizer.Sanitize(guidNode.NodeId))
            .Should()
            .Be(guidNode.NodeId);
        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, "core-vnet")
            .Should()
            .Be("vnet-1");
    }

    [Fact]
    public void TryResolveGraphNodeId_ambiguous_label_returns_null()
    {
        List<GraphNode> nodes =
        [
            CreateNode("vnet-east", "shared-vnet"),
            CreateNode("vnet-west", "shared-vnet"),
        ];

        DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(nodes, "shared-vnet").Should().BeNull();
    }

    private static GraphNode CreateNode(string nodeId, string label, Guid? cloudResourceId = null)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] =
                $"/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/{label}",
            ["arm.type"] = "Microsoft.Network/virtualNetworks",
            ["arm.resourceGroup"] = "network-rg",
        };

        if (cloudResourceId.HasValue)
        {
            properties["cloudResourceId"] = cloudResourceId.Value.ToString("D");
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = GraphTopologyCategories.Network,
            SourceType = "azure-inventory-snapshot",
            SourceId = properties["arm.id"],
            Properties = properties,
        };
    }
}
