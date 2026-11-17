using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>Committed review evidence must not be re-pointed by later κ projections.</summary>
[Trait("Category", "Unit")]
public sealed class KnowledgeModelGraphReprojectorCommittedRunTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData("Committed", false)]
    [InlineData("Executing", true)]
    public async Task TryReprojectForRunAsync_does_not_mutate_sealed_evidence_graph(
        string lifecycleStatus,
        bool hasGoldenManifest)
    {
        Guid runId = Guid.NewGuid();
        Guid anchoredGraphId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs.Setup(repo => repo.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                LegacyRunStatus = lifecycleStatus,
                GoldenManifestId = hasGoldenManifest ? Guid.NewGuid() : null,
                GraphSnapshotId = anchoredGraphId,
                ContextSnapshotId = Guid.NewGuid(),
            });

        Mock<IContextSnapshotRepository> contexts = new();
        Mock<IGraphSnapshotRepository> graphs = new();
        Mock<IKnowledgeGraphService> knowledgeGraph = new();
        Mock<IArchitectureKnowledgeModelGraphProjector> projector = new();

        KnowledgeModelGraphReprojector service = new(
            runs.Object,
            contexts.Object,
            graphs.Object,
            knowledgeGraph.Object,
            projector.Object);

        ArchitectureKnowledgeModel model = new()
        {
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "component-1",
                    Name = "API",
                    Kind = ArchitectureElementKind.Component,
                },
            ],
        };

        await service.TryReprojectForRunAsync(Scope, runId, model);

        runs.Verify(repo => repo.UpdateAsync(
            It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        contexts.VerifyNoOtherCalls();
        graphs.VerifyNoOtherCalls();
        knowledgeGraph.VerifyNoOtherCalls();
        projector.VerifyNoOtherCalls();
    }
}
