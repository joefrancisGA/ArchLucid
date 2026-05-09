using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequirementFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_WithRelatesTo_populates_trace_including_alternatives()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "r1",
                    NodeType = "Requirement",
                    Label = "R1",
                    Properties = new Dictionary<string, string> { ["text"] = "Must encrypt data at rest." }
                },
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = "TopologyResource",
                    Label = "store",
                    Category = "storage",
                    Properties = new()
                }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "r1",
                    ToNodeId = "t1",
                    EdgeType = "RELATES_TO",
                    Label = "relates to"
                }
            ]
        };

        RequirementFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Trace.RulesApplied.Should().Contain("requirement-surface");
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(2);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(p => p.Contains("Extend RELATES_TO", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AnalyzeAsync_WithoutRelatesTo_uses_unlinked_alternative_paths()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "r2",
                    NodeType = "Requirement",
                    Label = "R2",
                    Properties = new()
                }
            ],
            Edges = []
        };

        RequirementFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(2);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(p => p.Contains("TopologyResource", StringComparison.Ordinal));
    }
}
