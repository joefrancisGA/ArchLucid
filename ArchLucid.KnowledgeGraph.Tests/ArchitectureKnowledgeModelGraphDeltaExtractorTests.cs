using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Projection;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureKnowledgeModelGraphDeltaExtractorTests
{
    [Fact]
    public void ExtractGraphDelta_emits_no_entries_when_node_ids_differ_only_by_surrounding_whitespace()
    {
        const string nodeId = "akm:component-a";

        GraphSnapshot before = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = nodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Component A",
                },
            ],
        };

        GraphSnapshot after = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = $"  {nodeId}  ",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Component A",
                },
            ],
        };

        List<ArchitectureModelDiffEntry> delta =
            ArchitectureKnowledgeModelGraphDeltaExtractor.ExtractGraphDelta(before, after);

        delta.Should().BeEmpty();
    }

    [Fact]
    public void ExtractGraphDelta_classifies_trust_boundary_when_node_type_differs_only_by_case()
    {
        GraphSnapshot before = new() { Nodes = [] };

        GraphSnapshot after = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "akm:boundary-a",
                    NodeType = GraphNodeTypes.TrustBoundary.ToUpperInvariant(),
                    Label = "Boundary",
                },
            ],
        };

        List<ArchitectureModelDiffEntry> delta =
            ArchitectureKnowledgeModelGraphDeltaExtractor.ExtractGraphDelta(before, after);

        delta.Should().ContainSingle()
            .Which.ElementKind.Should().Be(ArchitectureElementKind.TrustBoundary);
    }
}
