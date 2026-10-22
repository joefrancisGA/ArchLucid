using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration.Pipeline;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineContextIngestionStageTests
{
    [SkippableFact]
    public async Task ExecuteAsync_ingests_context_persists_snapshot_and_updates_run_header()
    {
        Guid runId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        ContextSnapshot ingested = new()
        {
            SnapshotId = snapshotId,
            RunId = runId,
            ProjectId = "p1",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IContextIngestionService> ingest = new();
        ingest
            .Setup(s => s.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ingested);

        Mock<IContextSnapshotRepository> ctxRepo = new();
        ctxRepo
            .Setup(r => r.GetLatestAsync("p1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ContextSnapshot?)null);

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask)
            .Verifiable();

        Mock<IContextSnapshotRepository> ctxRepoForPersistence = new();
        ctxRepoForPersistence
            .Setup(r => r.SaveAsync(ingested, It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask)
            .Verifiable();

        IAuthorityPipelineStagePersistence persistence = new AuthorityPipelineStagePersistence(
            runRepo.Object,
            ctxRepoForPersistence.Object,
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IGraphSnapshotSqlAuthorityWriter>(),
            Mock.Of<ICosmosGraphSnapshotOutboxRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            AuthorityPipelineStagesExecutorTestFactory.CreateCosmosDbOptionsMonitor());

        AuthorityPipelineContextIngestionStage sut = new(
            ingest.Object,
            ctxRepo.Object,
            persistence,
            NullLogger<AuthorityPipelineContextIngestionStage>.Instance);

        Mock<IArchLucidUnitOfWork> uow = new();
        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(false);

        AuthorityPipelineContext ctx = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ScopeProjectId = Guid.NewGuid(),
                ProjectId = "p1",
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            Request = new ContextIngestionRequest { RunId = runId, ProjectId = "p1" },
            UnitOfWork = uow.Object,
            Scope = new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid()
            }
        };

        await sut.ExecuteAsync(ctx, CancellationToken.None);

        ctx.ContextSnapshot.Should().BeSameAs(ingested);
        ctx.Run.ContextSnapshotId.Should().Be(snapshotId);
        ingest.Verify(
            s => s.IngestAsync(It.Is<ContextIngestionRequest>(r => r.RunId == runId && r.ProjectId == "p1"), It.IsAny<CancellationToken>()),
            Times.Once);
        ctxRepoForPersistence.Verify();
        runRepo.Verify();
    }
}
