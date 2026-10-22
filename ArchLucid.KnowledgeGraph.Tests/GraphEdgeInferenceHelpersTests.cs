using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphEdgeInferenceHelpersTests
{
    [Fact]
    public void Deduplicate_merges_edges_when_endpoints_and_type_differ_only_by_surrounding_whitespace()
    {
        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                EdgeId = "edge-1",
                FromNodeId = "node-a",
                ToNodeId = "node-b",
                EdgeType = GraphEdgeTypes.ContainsResource,
                Weight = 1d,
            },
            new GraphEdge
            {
                EdgeId = "edge-2",
                FromNodeId = "  node-a  ",
                ToNodeId = "  node-b  ",
                EdgeType = $"  {GraphEdgeTypes.ContainsResource}  ",
                Weight = 2d,
            },
        ];

        List<GraphEdge> deduped = GraphEdgeInferenceHelpers.Deduplicate(edges);

        deduped.Should().ContainSingle();
        deduped[0].Weight.Should().Be(2d);
    }
}
