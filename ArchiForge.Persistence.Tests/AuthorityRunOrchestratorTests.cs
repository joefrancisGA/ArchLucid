using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.ContextIngestion.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Manifest.Sections;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.KnowledgeGraph.Models;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;
using ArchiForge.Persistence.Orchestration;
using ArchiForge.Persistence.Retrieval;
using ArchiForge.Persistence.Transactions;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using DecisioningManifestMetadata = ArchiForge.Decisioning.Manifest.Sections.ManifestMetadata;

namespace ArchiForge.Persistence.Tests;

/// <summary>
/// <see cref="AuthorityRunOrchestrator"/> unit tests with mocked dependencies (commit vs rollback paths).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunOrchestratorTests
{
    [Fact]
    public async Task ExecuteAsync_happy_path_commits_and_enqueues_retrieval()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"),
            WorkspaceId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"),
            ProjectId = Guid.Parse("a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(x => x.GetCurrentScope()).Returns(scope);

        Mock<IArchiForgeUnitOfWork> uow = new();
        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(false);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);

        Mock<IArchiForgeUnitOfWorkFactory> uowFactory = new();
        uowFactory.Setup(f => f.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(x => x.SaveAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        runRepo.Setup(x => x.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Guid contextSnapshotId = Guid.NewGuid();
        Mock<IContextSnapshotRepository> contextRepo = new();
        contextRepo.Setup(x => x.GetLatestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ContextSnapshot?)null);

        Mock<IContextIngestionService> ingestion = new();
        ingestion
            .Setup(x => x.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ContextIngestionRequest req, CancellationToken _) =>
                    new ContextSnapshot
                    {
                        SnapshotId = contextSnapshotId,
                        RunId = req.RunId,
                        ProjectId = req.ProjectId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        contextRepo.Setup(x => x.SaveAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Guid graphSnapshotId = Guid.NewGuid();
        Mock<IKnowledgeGraphService> kg = new();
        kg.Setup(x => x.BuildSnapshotAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ContextSnapshot ctx, CancellationToken _) =>
                    new GraphSnapshot
                    {
                        GraphSnapshotId = graphSnapshotId,
                        ContextSnapshotId = ctx.SnapshotId,
                        RunId = ctx.RunId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        Mock<IGraphSnapshotRepository> graphRepo = new();
        graphRepo.Setup(x => x.SaveAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Guid findingsId = Guid.NewGuid();
        Mock<IFindingsOrchestrator> findingsOrch = new();
        findingsOrch
            .Setup(x => x.GenerateFindingsSnapshotAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid runId, Guid ctxId, GraphSnapshot g, CancellationToken _) =>
                    new FindingsSnapshot
                    {
                        FindingsSnapshotId = findingsId,
                        RunId = runId,
                        ContextSnapshotId = ctxId,
                        GraphSnapshotId = g.GraphSnapshotId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        Mock<IFindingsSnapshotRepository> findingsRepo = new();
        findingsRepo.Setup(x => x.SaveAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Mock<IDecisionEngine> decisionEngine = new();
        decisionEngine
            .Setup(x => x.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid runId, Guid ctxId, GraphSnapshot g, FindingsSnapshot f, CancellationToken _) =>
                {
                    DecisionTrace trace = new()
                    {
                        DecisionTraceId = traceId,
                        RunId = runId,
                        CreatedUtc = DateTime.UtcNow,
                        RuleSetId = "rs",
                        RuleSetVersion = "1",
                        RuleSetHash = "h",
                    };

                    GoldenManifest manifest = NewMinimalManifest(scope, runId, ctxId, g.GraphSnapshotId, f.FindingsSnapshotId, traceId, manifestId);

                    return (manifest, trace);
                });

        Mock<IDecisionTraceRepository> decisionTraceRepo = new();
        decisionTraceRepo.Setup(x => x.SaveAsync(It.IsAny<DecisionTrace>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IGoldenManifestRepository> goldenRepo = new();
        goldenRepo.Setup(x => x.SaveAsync(It.IsAny<GoldenManifest>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IManifestHashService> hashService = new();
        hashService.Setup(x => x.ComputeHash(It.IsAny<GoldenManifest>())).Returns("computed-hash");

        Mock<IArtifactSynthesisService> synthesis = new();
        synthesis
            .Setup(x => x.SynthesizeAsync(It.IsAny<GoldenManifest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (GoldenManifest m, CancellationToken _) =>
                    new ArtifactBundle
                    {
                        BundleId = Guid.NewGuid(),
                        RunId = m.RunId,
                        ManifestId = m.ManifestId,
                        CreatedUtc = DateTime.UtcNow,
                        Artifacts = [],
                        Trace = new SynthesisTrace
                        {
                            TraceId = Guid.NewGuid(),
                            RunId = m.RunId,
                            ManifestId = m.ManifestId,
                            CreatedUtc = DateTime.UtcNow,
                        },
                    });

        Mock<IArtifactBundleRepository> bundleRepo = new();
        bundleRepo.Setup(x => x.SaveAsync(It.IsAny<ArtifactBundle>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        outbox.Setup(x => x.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunOrchestrator sut = new(
            uowFactory.Object,
            scopeProvider.Object,
            audit.Object,
            hashService.Object,
            runRepo.Object,
            ingestion.Object,
            contextRepo.Object,
            kg.Object,
            graphRepo.Object,
            findingsOrch.Object,
            findingsRepo.Object,
            decisionEngine.Object,
            decisionTraceRepo.Object,
            goldenRepo.Object,
            synthesis.Object,
            bundleRepo.Object,
            outbox.Object,
            NullLogger<AuthorityRunOrchestrator>.Instance);

        ContextIngestionRequest request = new()
        {
            ProjectId = "proj-orchestrator-test",
            Description = "d",
        };

        RunRecord result = await sut.ExecuteAsync(request, CancellationToken.None);

        result.ProjectId.Should().Be(request.ProjectId);
        uow.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Never);
        outbox.Verify(
            x => x.EnqueueAsync(result.RunId, scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_when_decision_engine_fails_rolls_back_without_commit()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(x => x.GetCurrentScope()).Returns(scope);

        Mock<IArchiForgeUnitOfWork> uow = new();
        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(false);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);

        Mock<IArchiForgeUnitOfWorkFactory> uowFactory = new();
        uowFactory.Setup(f => f.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(x => x.SaveAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        runRepo.Setup(x => x.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Guid contextSnapshotId = Guid.NewGuid();
        Mock<IContextSnapshotRepository> contextRepo = new();
        contextRepo.Setup(x => x.GetLatestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ContextSnapshot?)null);

        Mock<IContextIngestionService> ingestion = new();
        ingestion
            .Setup(x => x.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ContextIngestionRequest req, CancellationToken _) =>
                    new ContextSnapshot
                    {
                        SnapshotId = contextSnapshotId,
                        RunId = req.RunId,
                        ProjectId = req.ProjectId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        contextRepo.Setup(x => x.SaveAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IKnowledgeGraphService> kg = new();
        kg.Setup(x => x.BuildSnapshotAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ContextSnapshot ctx, CancellationToken _) =>
                    new GraphSnapshot
                    {
                        GraphSnapshotId = Guid.NewGuid(),
                        ContextSnapshotId = ctx.SnapshotId,
                        RunId = ctx.RunId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        Mock<IGraphSnapshotRepository> graphRepo = new();
        graphRepo.Setup(x => x.SaveAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IFindingsOrchestrator> findingsOrch = new();
        findingsOrch
            .Setup(x => x.GenerateFindingsSnapshotAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid runId, Guid ctxId, GraphSnapshot g, CancellationToken _) =>
                    new FindingsSnapshot
                    {
                        FindingsSnapshotId = Guid.NewGuid(),
                        RunId = runId,
                        ContextSnapshotId = ctxId,
                        GraphSnapshotId = g.GraphSnapshotId,
                        CreatedUtc = DateTime.UtcNow,
                    });

        Mock<IFindingsSnapshotRepository> findingsRepo = new();
        findingsRepo.Setup(x => x.SaveAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IDecisionEngine> decisionEngine = new();
        decisionEngine
            .Setup(x => x.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("decision failed"));

        Mock<IDecisionTraceRepository> decisionTraceRepo = new();
        Mock<IGoldenManifestRepository> goldenRepo = new();
        Mock<IManifestHashService> hashService = new();
        Mock<IArtifactSynthesisService> synthesis = new();
        Mock<IArtifactBundleRepository> bundleRepo = new();
        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunOrchestrator sut = new(
            uowFactory.Object,
            scopeProvider.Object,
            audit.Object,
            hashService.Object,
            runRepo.Object,
            ingestion.Object,
            contextRepo.Object,
            kg.Object,
            graphRepo.Object,
            findingsOrch.Object,
            findingsRepo.Object,
            decisionEngine.Object,
            decisionTraceRepo.Object,
            goldenRepo.Object,
            synthesis.Object,
            bundleRepo.Object,
            outbox.Object,
            NullLogger<AuthorityRunOrchestrator>.Instance);

        ContextIngestionRequest request = new() { ProjectId = "proj-fail" };

        Func<Task> act = async () => await sut.ExecuteAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("decision failed");

        uow.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    private static GoldenManifest NewMinimalManifest(
        ScopeContext scope,
        Guid runId,
        Guid contextId,
        Guid graphId,
        Guid findingsId,
        Guid traceId,
        Guid manifestId)
    {
        return new GoldenManifest
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "pending",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new DecisioningManifestMetadata { Name = "orch-test" },
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = [],
        };
    }
}
