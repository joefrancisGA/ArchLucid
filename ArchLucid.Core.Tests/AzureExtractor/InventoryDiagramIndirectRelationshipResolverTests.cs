using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramIndirectRelationshipResolverTests
{
    [Fact]
    public void IsCitedEdge_returns_false_for_resource_group_collocation()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-collocation",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.ResourceGroupCollocation,
        };

        InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge).Should().BeFalse();
    }

    [Fact]
    public void ResolveEvidenceCurrency_returns_observed_for_observed_dependency_edge()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-observed",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.ObservedDependency,
        };

        InventoryDiagramIndirectRelationshipResolver
            .ResolveEvidenceCurrency(edge, fromNode: null)
            .Should()
            .Be(InventoryDiagramEvidenceCurrency.Observed);
    }

    [Fact]
    public void ResolveEvidenceCurrency_returns_configured_from_source_node_property()
    {
        GraphNode fromNode = new()
        {
            NodeId = "from",
            NodeType = "TopologyResource",
            Label = "from",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                    InventoryDiagramEvidenceCurrency.Configured.ToString(),
            },
        };
        GraphEdge edge = new()
        {
            EdgeId = "edge-configured",
            FromNodeId = "from",
            ToNodeId = "to",
            EdgeType = "CONNECTS_TO",
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
        };

        InventoryDiagramIndirectRelationshipResolver
            .ResolveEvidenceCurrency(edge, fromNode)
            .Should()
            .Be(InventoryDiagramEvidenceCurrency.Configured);
    }
}
