using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Suite", "Core")]
public sealed class FindingsOrchestratorPolicyExpectationStampTests
{
    private static readonly IInsightDensityGate InsightDensityGate = DeterministicInsightDensityGate.CreateDefault();

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_stamps_topology_extra_from_effective_governance()
    {
        GraphSnapshot graph = CreateGraphWithContext();
        Mock<IFindingEngine> engine = CreatePassThroughEngine();
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults =
            {
                [PolicyPackExpectationAdvisoryKeys.TopologyCategoriesAdd] = "identity",
            },
        };

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<IEffectiveGovernanceLoader> loader = new();
        loader.Setup(l => l.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(effective);

        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate,
            TimeProvider.System,
            null,
            scope.Object,
            loader.Object);

        await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        GraphNode contextNode = graph.Nodes.Single(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        contextNode.Properties[ContextGraphPropertyKeys.PolicyExpectedTopologyCategories]
            .Should().Be("identity");
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_loader_failure_is_fail_open()
    {
        GraphSnapshot graph = CreateGraphWithContext();
        Mock<IFindingEngine> engine = CreatePassThroughEngine();
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<IEffectiveGovernanceLoader> loader = new();
        loader.Setup(l => l.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("governance unavailable"));

        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate,
            TimeProvider.System,
            null,
            scope.Object,
            loader.Object);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);

        snapshot.Findings.Should().BeEmpty();
        graph.Nodes.Single().Properties.Should().NotContainKey(ContextGraphPropertyKeys.PolicyExpectedTopologyCategories);
    }

    private static GraphSnapshot CreateGraphWithContext() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "context-1",
                NodeType = GraphNodeTypes.ContextSnapshot,
                Label = "scope",
                Properties = new(),
            },
        ],
    };

    private static Mock<IFindingEngine> CreatePassThroughEngine()
    {
        Mock<IFindingEngine> engine = new();
        engine.Setup(e => e.EngineType).Returns("noop");
        engine.Setup(e => e.Category).Returns("Topology");
        engine.Setup(e => e.AnalyzeAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        return engine;
    }
}
