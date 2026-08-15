using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class RequirementCrossRunDiffFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_WhenRequirementsRegressed_EmitsWarningGapFinding()
    {
        RequirementCrossRunDiffFindingEngine engine = new();
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
                        [ContextGraphPropertyKeys.PriorRequirementNames] = "availability|encryption"
                    }
                },
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        findings[0].Title.Should().Contain("regressed");
    }

    [Fact]
    public async Task AnalyzeAsync_WhenRequirementsExpanded_EmitsInfoCoverageFinding()
    {
        RequirementCrossRunDiffFindingEngine engine = new();
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
                        [ContextGraphPropertyKeys.PriorRequirementNames] = "availability"
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

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Info);
        RequirementCoverageFindingPayload? payload = findings[0].Payload as RequirementCoverageFindingPayload;
        payload.Should().NotBeNull();
        payload!.UncoveredRequirements.Should().Contain("observability");
    }
}
