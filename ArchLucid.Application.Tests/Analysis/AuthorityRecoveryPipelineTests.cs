using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuthorityRecoveryPipelineTests
{
    [Fact]
    public async Task Missing_saved_output_cannot_be_regenerated_or_used_to_publish()
    {
        ScopeContext scope = CreateScope();
        RunRecord run = new() { RunId = Guid.NewGuid(), ContextSnapshotId = Guid.NewGuid() };
        FakeTimeProvider clock = new();
        Mock<IAnalysisRecoveryRepository> storage = new(MockBehavior.Strict);
        Mock<IArchLucidUnitOfWorkFactory> factory = new(MockBehavior.Strict);
        AnalysisRecoveryStageKey key = AuthorityRecoveryPipeline.Key(scope, run.RunId, "context_ingestion");
        storage.Setup(s => s.ClaimAsync(key, It.IsAny<string>(), It.IsAny<Guid>(), 30, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnalysisRecoveryStageKey _, string version, Guid _, int _, int _, CancellationToken _) =>
                new AnalysisRecoveryClaim
                {
                    State = "succeeded", InputVersion = version, ResultReference = run.ContextSnapshotId.Value.ToString("D")
                });
        AuthorityRecoveryPipeline recovery = CreatePipeline(storage.Object, factory.Object, clock);
        using AnalysisExecutionBudget budget = new(new AnalysisStageExecutionOptions(), clock, TimeSpan.FromMinutes(5),
            CancellationToken.None);
        AuthorityPipelineContext context = new()
        {
            Run = run, Scope = scope, Request = new ContextIngestionRequest(), ExecutionBudget = budget,
            UnitOfWork = Mock.Of<IArchLucidUnitOfWork>(), UsesDurableRecovery = true
        };

        await Assert.ThrowsAsync<ConflictException>(() => recovery.ExecuteAsync(context,
            (_, _) => throw new InvalidOperationException("Reused stage must not regenerate."),
            (_, _) => throw new InvalidOperationException("Missing checkpoint output must not publish."),
            CancellationToken.None));
        factory.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Redelivery_after_handoff_commit_does_not_create_starter_tasks_twice()
    {
        ScopeContext scope = CreateScope();
        RunRecord run = new() { RunId = Guid.NewGuid(), GoldenManifestId = Guid.NewGuid(), ArtifactBundleId = Guid.NewGuid() };
        string manifest = run.GoldenManifestId.Value.ToString("D");
        Mock<IAnalysisRecoveryRepository> storage = new(MockBehavior.Strict);
        Mock<IArchLucidUnitOfWorkFactory> factory = new(MockBehavior.Strict);
        Mock<IArchLucidUnitOfWork> transaction = new();
        AnalysisRecoveryStageKey published = AuthorityRecoveryPipeline.Key(scope, run.RunId, "seal_and_publish");
        AnalysisRecoveryStageKey handoff = AuthorityRecoveryPipeline.Key(scope, run.RunId, "agent_handoff");
        bool persisted = false;
        int taskWrites = 0;
        storage.Setup(s => s.ReadAsync(published, CancellationToken.None))
            .ReturnsAsync(new AnalysisRecoveryClaim { State = "succeeded", ResultReference = manifest });
        storage.Setup(s => s.ClaimAsync(handoff, It.IsAny<string>(), It.IsAny<Guid>(), 30, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnalysisRecoveryStageKey _, string version, Guid owner, int _, int _, CancellationToken _) =>
                new AnalysisRecoveryClaim
                {
                    State = persisted ? "succeeded" : "running", InputVersion = version,
                    Owner = persisted ? null : owner, Fence = 1, Attempts = 1
                });
        storage.Setup(s => s.CompleteAsync(handoff, It.IsAny<Guid>(), 1, manifest, transaction.Object,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        transaction.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>())).Callback(() => persisted = true)
            .Returns(Task.CompletedTask);
        factory.Setup(f => f.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(transaction.Object);
        AuthorityRecoveryPipeline recovery = CreatePipeline(storage.Object, factory.Object, new FakeTimeProvider());

        await recovery.MaterializeHandoffAsync(scope, run, WriteTasks, CancellationToken.None);
        await recovery.MaterializeHandoffAsync(scope, run, WriteTasks, CancellationToken.None);

        Assert.Equal(1, taskWrites);
        factory.Verify(f => f.CreateAsync(It.IsAny<CancellationToken>()), Times.Once);

        Task WriteTasks(IArchLucidUnitOfWork? uow, CancellationToken _)
        {
            Assert.Same(transaction.Object, uow);
            taskWrites++;

            return Task.CompletedTask;
        }
    }

    private static ScopeContext CreateScope() => new()
    {
        TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
    };

    private static AuthorityRecoveryPipeline CreatePipeline(IAnalysisRecoveryRepository storage,
        IArchLucidUnitOfWorkFactory factory, TimeProvider clock)
    {
        AuthorityPipelineStageContextHydrator hydrator = new(
            Mock.Of<IContextSnapshotRepository>(), Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(), Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(), Mock.Of<IArtifactBundleRepository>());
        AuthorityPipelineStagesExecutor executor = new(
            Mock.Of<IAuthorityPipelineContextIngestionStage>(), Mock.Of<IAuthorityPipelineGraphStage>(),
            Mock.Of<IAuthorityPipelineFindingsStage>(), Mock.Of<IAuthorityPipelineDecisioningStage>(),
            Mock.Of<IAuthorityPipelineArtifactsStage>(), hydrator, Mock.Of<IRunGovernanceScopePinService>(),
            Mock.Of<IRunStageOutcomesRepository>(), NullLogger<AuthorityPipelineStagesExecutor>.Instance);
        Mock<IOptionsMonitor<AnalysisStageExecutionOptions>> options = new();
        options.SetupGet(o => o.CurrentValue).Returns(new AnalysisStageExecutionOptions { EnableDurableAuthorityRecovery = true });
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integration = new();
        integration.SetupGet(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return new AuthorityRecoveryPipeline(storage, factory, executor, options.Object, clock,
            NullLogger<AuthorityRecoveryPipeline>.Instance, integration.Object);
    }
}
