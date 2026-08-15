using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotRequirementDiffAnalyzerTests
{
    [Fact]
    public void AnalyzeNameDelta_WhenPriorRequirementNamesPresent_ReportsAddedAndRemoved()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.PriorRequirementNames] = "availability|encryption|retention"
                    }
                },
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "req-2",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "observability",
                    Properties = new()
                }
            ]
        };

        RequirementNameDiffResult diff = GraphSnapshotRequirementDiffAnalyzer.AnalyzeNameDelta(graph);

        diff.RemovedRequirementNames.Should().Contain("encryption");
        diff.RemovedRequirementNames.Should().Contain("retention");
        diff.AddedRequirementNames.Should().Contain("observability");
    }
}
