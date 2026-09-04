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
public sealed class RequirementCrossRunDiffFindingEngineTests
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

    private static RequirementCrossRunDiffFindingEngine CreateEngine(
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

        return new RequirementCrossRunDiffFindingEngine(graphSnapshots.Object, scopeProvider.Object);
    }

    [Fact]
    public async Task AnalyzeAsync_without_prior_throws()
    {
        RequirementCrossRunDiffFindingEngine engine = CreateEngine();

        Func<Task> act = () => engine.AnalyzeAsync(new GraphSnapshot(), null, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires FindingAnalysisContext.Prior*");
    }

    [Fact]
    public async Task AnalyzeAsync_when_prior_run_bound_without_revision_data_throws()
    {
        RequirementCrossRunDiffFindingEngine engine = CreateEngine();
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
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                }
            ]
        };

        Func<Task> act = () => engine.AnalyzeAsync(graph, AnalysisContextWithPrior(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires prior revision data*");
    }

    [Fact]
    public async Task AnalyzeAsync_WhenRequirementsRegressed_EmitsWarningGapFinding()
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
                },
                new GraphNode
                {
                    NodeId = "req-prior-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "encryption",
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "req-prior-2",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                }
            ]
        };

        RequirementCrossRunDiffFindingEngine engine = CreateEngine(priorGraph);
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
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
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
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        findings[0].Title.Should().Contain("regressed");
        findings[0].RelatedNodeIds.Should().Contain("context-1");
        findings[0].RelatedNodeIds.Should().Contain("req-1");
    }

    [Fact]
    public async Task AnalyzeAsync_WhenRequirementsExpanded_EmitsInfoCoverageFinding()
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
                },
                new GraphNode
                {
                    NodeId = "req-prior-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                }
            ]
        };

        RequirementCrossRunDiffFindingEngine engine = CreateEngine(priorGraph);
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
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "availability",
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "req-2",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "encryption",
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
        findings[0].Payload.Should().BeOfType<RequirementCoverageFindingPayload>();
    }
}
