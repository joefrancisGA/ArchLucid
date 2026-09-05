using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyCrossRunDiffFindingEngineTests
{
    private static FindingAnalysisContext AnalysisContextWithPrior() =>
        new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            Prior = new PriorReviewSnapshots
            {
                PriorRunId = Guid.NewGuid(),
                PriorArchitectureVersionId = Guid.NewGuid(),
            },
        };

    private static TopologyCrossRunDiffFindingEngine CreateEngine(
        GraphSnapshot? priorGraph = null,
        ScopeContext? scope = null)
    {
        ScopeContext resolvedScope = scope ?? new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(resolvedScope);

        Mock<IGraphSnapshotRepository> graphSnapshots = new();
        graphSnapshots
            .Setup(r => r.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(priorGraph);

        return new TopologyCrossRunDiffFindingEngine(graphSnapshots.Object, scopeProvider.Object);
    }

    [Fact]
    public async Task AnalyzeAsync_when_prior_graph_has_no_topology_but_current_expands_emits_info_coverage_finding()
    {
        GraphSnapshot priorGraph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "prior-context",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "prior-context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                }
            ]
        };

        TopologyCrossRunDiffFindingEngine engine = CreateEngine(priorGraph);
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
                },
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet",
                    Category = GraphTopologyCategories.Network,
                    Properties = new()
                }
            ]
        };

        FindingAnalysisContext context = AnalysisContextWithPrior();
        context.Prior!.PriorGraphSnapshotId = Guid.NewGuid();

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(
            graph,
            context,
            CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Info);
        findings[0].Payload.Should().BeOfType<TopologyCoverageFindingPayload>();
    }
}
