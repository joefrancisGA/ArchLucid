using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration.Pipeline;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineGraphStageTests
{
    [Fact]
    public async Task ExecuteAsync_persists_observation_stamps_and_reuses_the_durable_graph_on_retry()
    {
        Guid runId = Guid.NewGuid();
        ContextSnapshot input = new() { SnapshotId = Guid.NewGuid(), RunId = runId };
        ArchitectureKnowledgeModel model = new() { ModelId = "model" };
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = input.SnapshotId,
            Nodes = [new GraphNode { NodeType = "ContextSnapshot" }],
        };
        RunRecord run = new() { RunId = runId, PinnedPolicyPackIdsHashSha256 = Enumerable.Repeat((byte)0xAB, 32).ToArray() };
        ScopeContext scope = new();
        IArchLucidUnitOfWork unitOfWork = Mock.Of<IArchLucidUnitOfWork>();
        AuthorityPipelineContext context = new()
        {
            Run = run,
            Scope = scope,
            Request = new ContextIngestionRequest(),
            UnitOfWork = unitOfWork,
            ContextSnapshot = input,
        };

        CancellationToken ct = CancellationToken.None;
        Mock<IKnowledgeGraphService> graphService = new();
        graphService.Setup(s => s.BuildSnapshotAsync(input, ct)).ReturnsAsync(graph);
        Mock<IArchitectureKnowledgeModelAccess> modelAccess = new();
        modelAccess.Setup(s => s.GetForRunAsync(scope, runId, ct)).ReturnsAsync(model);
        Mock<IBoundArchitectureInventoryGraphOverlayApplicator> overlay = new();
        overlay.Setup(s => s.ApplyAsync(scope, run, graph, ct)).ReturnsAsync(graph);

        string? storedGraph = null;
        Mock<IAuthorityPipelineStagePersistence> persistence = new();
        persistence.Setup(p => p.SaveGraphAsync(It.IsAny<GraphSnapshot>(), scope, unitOfWork, ct))
            .Callback<GraphSnapshot, ScopeContext, IArchLucidUnitOfWork, CancellationToken>(
                (snapshot, _, _, _) => storedGraph = JsonSerializer.Serialize(snapshot))
            .Returns(Task.CompletedTask);
        persistence.Setup(p => p.UpdateRunAsync(run, unitOfWork, ct)).Returns(Task.CompletedTask);

        Mock<IGraphSnapshotRepository> graphRepository = new();
        graphRepository.Setup(p => p.GetByIdAsync(scope, graph.GraphSnapshotId, ct))
            .ReturnsAsync(() => JsonSerializer.Deserialize<GraphSnapshot>(storedGraph!));
        AuthorityPipelineGraphStage stage = new(
            graphService.Object,
            graphRepository.Object,
            persistence.Object,
            overlay.Object,
            NullLogger<AuthorityPipelineGraphStage>.Instance,
            knowledgeModelAccess: modelAccess.Object);

        await stage.ExecuteAsync(context, ct);

        GraphSnapshot durableSnapshot = JsonSerializer.Deserialize<GraphSnapshot>(storedGraph!)!;
        Dictionary<string, string> properties = Assert.Single(durableSnapshot.Nodes).Properties;
        Assert.Equal(GraphSnapshotCanonicalFingerprint.Compute(input),
            properties[ContextGraphPropertyKeys.ContextCanonicalFingerprint]);
        Assert.Equal(GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(model),
            properties[ContextGraphPropertyKeys.KnowledgeModelFingerprint]);
        Assert.Equal(Convert.ToHexString(run.PinnedPolicyPackIdsHashSha256!),
            properties[ContextGraphPropertyKeys.PolicyPackPinsHashSha256Hex]);

        await stage.ExecuteAsync(context, ct);

        Assert.Equal("reused_from_run_header", context.GraphResolution?.ResolutionMode);
        graphService.Verify(s => s.BuildSnapshotAsync(input, ct), Times.Once);
        persistence.Verify(p => p.SaveGraphAsync(It.IsAny<GraphSnapshot>(), scope, unitOfWork, ct), Times.Once);
    }
}
