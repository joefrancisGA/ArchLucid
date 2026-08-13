using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class RequirementTraceabilityAnalyzerTests
{
    [Fact]
    public void Analyze_WhenRequirementHasNoTopologyLink_EmitsGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "REQ-1",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["text"] = "Expose HTTPS API"
                    }
                }
            ]
        };

        IReadOnlyList<RequirementTraceabilityGap> gaps = RequirementTraceabilityAnalyzer.Analyze(graph);

        gaps.Should().ContainSingle(g => g.GapCode == "requirement-without-topology-link");
    }

    [Fact]
    public void Analyze_WhenRequirementLinkedToTopology_DoesNotEmitTopologyLinkGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "REQ-1",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["text"] = "Expose HTTPS API"
                    }
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    FromNodeId = "req-1",
                    ToNodeId = "cmp-1",
                    Weight = 1
                }
            ]
        };

        RequirementTraceabilityAnalyzer.Analyze(graph)
            .Should().NotContain(g => g.GapCode == "requirement-without-topology-link");
    }
}
