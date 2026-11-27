using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class KnowledgeModelGraphReprojectorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
        WorkspaceId = Guid.Parse("10000000-0000-0000-0000-000000000002"),
        ProjectId = Guid.Parse("10000000-0000-0000-0000-000000000003"),
    };

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task Reprojection_leaves_the_pipeline_graph_untouched_after_findings_or_seal(bool hasFindings, bool hasManifest)
    {
        RunRecord run = NewRun();
        run.FindingsSnapshotId = hasFindings ? Guid.NewGuid() : null;
        run.GoldenManifestId = hasManifest ? Guid.NewGuid() : null;
        Guid? originalGraphId = run.GraphSnapshotId;
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdAsync(Scope, run.RunId, CancellationToken.None)).ReturnsAsync(run);
        Mock<IContextSnapshotRepository> contexts = new(MockBehavior.Strict);
        Mock<IGraphSnapshotRepository> graphs = new(MockBehavior.Strict);
        Mock<IKnowledgeGraphService> graphService = new(MockBehavior.Strict);
        Mock<IArchitectureKnowledgeModelGraphProjector> projector = new(MockBehavior.Strict);

        KnowledgeModelGraphReprojector reprojector = new(
            runs.Object, contexts.Object, graphs.Object, graphService.Object, projector.Object);

        await reprojector.TryReprojectForRunAsync(Scope, run.RunId, ProjectableModel());

        run.GraphSnapshotId.Should().Be(originalGraphId);
        runs.Verify(r => r.GetByIdAsync(Scope, run.RunId, CancellationToken.None), Times.Once);
        runs.VerifyNoOtherCalls();
        contexts.VerifyNoOtherCalls();
        graphs.VerifyNoOtherCalls();
        graphService.VerifyNoOtherCalls();
        projector.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Reprojection_persists_and_links_the_replacement_before_findings_are_materialized()
    {
        RunRecord run = NewRun();
        ContextSnapshot context = new() { SnapshotId = run.ContextSnapshotId!.Value, RunId = run.RunId };
        ArchitectureKnowledgeModel model = ProjectableModel();
        GraphSnapshot replacement = new() { GraphSnapshotId = Guid.NewGuid(), ContextSnapshotId = context.SnapshotId, RunId = run.RunId };
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdAsync(Scope, run.RunId, CancellationToken.None)).ReturnsAsync(run);
        Mock<IContextSnapshotRepository> contexts = new(MockBehavior.Strict);
        contexts.Setup(c => c.GetByIdAsync(Scope.ToReadScope(), context.SnapshotId, CancellationToken.None)).ReturnsAsync(context);
        Mock<IKnowledgeGraphService> graphService = new(MockBehavior.Strict);
        graphService.Setup(g => g.BuildSnapshotAsync(context, CancellationToken.None)).ReturnsAsync(new GraphSnapshot());
        Mock<IArchitectureKnowledgeModelGraphProjector> projector = new(MockBehavior.Strict);
        projector.Setup(p => p.Project(model, context, run.RunId)).Returns(replacement);
        Mock<IGraphSnapshotRepository> graphs = new(MockBehavior.Strict);
        MockSequence writes = new();
        graphs.InSequence(writes).Setup(g => g.SaveAsync(
            It.Is<GraphSnapshot>(s => s.GraphSnapshotId == replacement.GraphSnapshotId), CancellationToken.None, null, null))
            .Returns(Task.CompletedTask);
        runs.InSequence(writes).Setup(r => r.UpdateAsync(
            It.Is<RunRecord>(h => h == run && h.GraphSnapshotId == replacement.GraphSnapshotId), CancellationToken.None, null, null))
            .Returns(Task.CompletedTask);

        KnowledgeModelGraphReprojector reprojector = new(
            runs.Object, contexts.Object, graphs.Object, graphService.Object, projector.Object);

        await reprojector.TryReprojectForRunAsync(Scope, run.RunId, model);

        run.GraphSnapshotId.Should().Be(replacement.GraphSnapshotId);
        graphs.Verify(g => g.SaveAsync(It.IsAny<GraphSnapshot>(), CancellationToken.None, null, null), Times.Once);
        runs.Verify(r => r.UpdateAsync(run, CancellationToken.None, null, null), Times.Once);
    }

    private static RunRecord NewRun() => new()
    {
        RunId = Guid.NewGuid(),
        ContextSnapshotId = Guid.NewGuid(),
        GraphSnapshotId = Guid.NewGuid(),
    };

    private static ArchitectureKnowledgeModel ProjectableModel() => new()
    {
        Elements = [new ArchitectureModelElement { Kind = ArchitectureElementKind.Component }],
    };
}
