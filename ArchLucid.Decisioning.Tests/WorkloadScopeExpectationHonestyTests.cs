using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class WorkloadScopeExpectationHonestyTests
{
    [Fact]
    public void HasWorkloadScopeMetadata_is_false_when_context_has_no_scope_tokens()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
        };

        WorkloadScopeExpectationHonesty.HasWorkloadScopeMetadata(graph).Should().BeFalse();
    }

    [Fact]
    public async Task TopologyCoverageFindingEngine_without_scope_metadata_mentions_legacy_default()
    {
        TopologyCoverageResult coverage = new()
        {
            TopologyNodeCount = 2,
            PresentCategories = ["compute"],
            MissingCategories = ["network"],
            TopologyNodeIds = ["t1", "t2"],
        };

        Mock<IGraphCoverageAnalyzer> analyzer = new();
        analyzer.Setup(x => x.AnalyzeTopology(It.IsAny<GraphSnapshot>())).Returns(coverage);

        TopologyCoverageFindingEngine engine = new(analyzer.Object);
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
        };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Rationale.Should().Contain(WorkloadScopeExpectationHonesty.TopologyLegacyDefaultNote);
        findings[0].RecommendedActions.Should().Contain(
            "Otherwise record in review notes that the legacy four-pillar default applies for this intake.");
    }
}
