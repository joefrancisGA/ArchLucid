using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class SecurityTraceabilityAnalyzerTests
{
    [Fact]
    public void Analyze_WhenSecurityBaselineHasNoProtects_EmitsGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sec-1",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "encrypt-at-rest",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["status"] = "present"
                    }
                }
            ]
        };

        SecurityTraceabilityAnalyzer.Analyze(graph)
            .Should().ContainSingle(g => g.GapCode == "security-baseline-without-protects");
    }

    [Fact]
    public void Analyze_WhenComputeUnprotected_EmitsComputeGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sec-1",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "waf",
                    Properties = new()
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
                    EdgeType = GraphEdgeTypes.Protects,
                    FromNodeId = "sec-1",
                    ToNodeId = "stor-1",
                    Weight = 1
                }
            ]
        };

        SecurityTraceabilityAnalyzer.Analyze(graph)
            .Should().Contain(g => g.GapCode == "compute-without-security-baseline");
    }
}
