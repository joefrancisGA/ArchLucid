using System.Data;

using ArchLucid.Application.Agents;
using ArchLucid.Application;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Replay;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures replay loads the source run through <see cref="IRunDetailQueryService" /> (canonical path)
///     rather than assembling run + tasks from separate repository calls.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ReplayRunServiceTests
{
    private static IAgentEvaluationService EmptyAgentEvaluationService()
    {
        Mock<IAgentEvaluationService> mock = new();
        mock.Setup(
                x => x.EvaluateAsync(
                    It.IsAny<string>(),
                    It.IsAny<ArchitectureRequest>(),
                    It.IsAny<AgentEvidencePackage>(),
                    It.IsAny<IReadOnlyCollection<AgentTask>>(),
                    It.IsAny<IReadOnlyCollection<AgentResult>>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private static IDecisionEngineV2 EmptyDecisionEngineV2()
    {
        Mock<IDecisionEngineV2> mock = new();
        mock.Setup(
                x => x.ResolveAsync(
                    It.IsAny<string>(),
                    It.IsAny<ArchitectureRequest>(),
                    It.IsAny<IReadOnlyCollection<AgentTask>>(),
                    It.IsAny<IReadOnlyCollection<AgentResult>>(),
                    It.IsAny<IReadOnlyCollection<AgentEvaluation>>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private readonly Mock<IRunRepository> _authorityRunRepository = new();
    private readonly Mock<IDecisionEngineService> _decisionEngine = new();
    private readonly Mock<IAgentEvidencePackageRepository> _evidenceRepository = new();
    private readonly Mock<IAgentTaskRepository> _taskRepository = new();
    private readonly Mock<IAgentExecutorResolver> _executorResolver = new();
    private readonly Mock<IArchitectureRequestRepository> _requestRepository = new();

    private readonly Mock<IRunDetailQueryService> _runDetailQueryService = new();
    private readonly Mock<IScopeContextProvider> _scopeContextProvider = new();
    private readonly ReplayRunService _sut;

    public ReplayRunServiceTests()
    {
        _scopeContextProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        });
        _authorityRunRepository
            .Setup(r => r.SaveAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        _authorityRunRepository.Setup(r =>
                r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        _taskRepository
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IEnumerable<AgentTask>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        // ADR 0030 PR A3 (2026-04-24): ICoordinatorDecisionTraceRepository was removed from
        // ReplayRunService — decision traces are persisted via IAuthorityCommittedManifestChainWriter only.
        IReplayRunCloneStage cloneStage = new ReplayRunCloneStage();
        IReplayRunPrepareStage prepareStage = new ReplayRunPrepareStage(
            _runDetailQueryService.Object,
            _requestRepository.Object,
            _evidenceRepository.Object,
            _authorityRunRepository.Object,
            _scopeContextProvider.Object,
            _taskRepository.Object,
            EmptyStageOutcomesRepository(),
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage,
            Mock.Of<IReRunExecuteSealedManifestPinGate>());
        IReplayRunCommitStage commitStage = new ReplayRunCommitStage(
            _decisionEngine.Object,
            EmptyAgentEvaluationService(),
            EmptyDecisionEngineV2(),
            _scopeContextProvider.Object,
            CreateAuthorityChainWriterMock().Object,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAuditService>(),
            UnitTestActor(),
            Mock.Of<IArchitectureRunCommitOrchestrator>(),
            Mock.Of<ICommitRunIdempotencyCoordinator>(),
            _authorityRunRepository.Object,
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage,
            Mock.Of<IReRunExecuteSealedManifestPinGate>(),
            NullLogger<ReplayRunCommitStage>.Instance);
        IReplayRunExecutePreparedStage executePreparedStage = new ReplayRunExecutePreparedStage(
            _runDetailQueryService.Object,
            _requestRepository.Object,
            _evidenceRepository.Object,
            _executorResolver.Object,
            Mock.Of<IAuthorityRunOrchestrator>(),
            prepareStage,
            cloneStage,
            commitStage,
            _authorityRunRepository.Object,
            _scopeContextProvider.Object,
            Mock.Of<IRunGovernanceScopePinService>(),
            Mock.Of<IReRunExecuteSealedManifestPinGate>());
        _sut = new ReplayRunService(prepareStage, executePreparedStage);
    }

    private static IRunStageOutcomesRepository EmptyStageOutcomesRepository()
    {
        Mock<IRunStageOutcomesRepository> mock = new();
        mock.Setup(r => r.ListByRunIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private static IActorContext UnitTestActor()
    {
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("unit-test");

        return actor.Object;
    }

    private static Mock<IAuthorityCommittedManifestChainWriter> CreateAuthorityChainWriterMock()
    {
        Mock<IAuthorityCommittedManifestChainWriter> mock = new();
        mock.Setup(x => x.PersistCommittedChainAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<GoldenManifest>(),
                It.IsAny<AuthorityChainKeying>(),
                It.IsAny<DateTime>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>(),
                It.IsAny<IReadOnlyList<Finding>?>(),
                It.IsAny<AuthorityCommittedChainSeedCustomization?>()))
            .ReturnsAsync((ScopeContext _, Guid _, string _, GoldenManifest _, AuthorityChainKeying k, DateTime _,
                    bool _, CancellationToken _, IDbConnection? _, IDbTransaction? _, IReadOnlyList<Finding>? _,
                    AuthorityCommittedChainSeedCustomization? _) =>
                new AuthorityManifestPersistResult(
                    k.ContextSnapshotId,
                    k.GraphSnapshotId,
                    k.FindingsSnapshotId,
                    k.DecisionTraceId,
                    k.ManifestId));

        return mock;
    }

    [SkippableFact]
    public async Task ReplayAsync_WhenRunDetailMissing_ThrowsRunNotFoundException()
    {
        _runDetailQueryService
            .Setup(s => s.GetRunDetailAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Func<Task<ReplayRunResult>> act = async () => await _sut.ReplayAsync("missing");

        await act.Should().ThrowAsync<RunNotFoundException>();
        _authorityRunRepository.Verify(
            r => r.SaveAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null), Times.Never);
    }

    [SkippableFact]
    public async Task ReplayAsync_WhenNoTasks_ThrowsInvalidOperationException()
    {
        _runDetailQueryService
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = "run-1",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Created
                },
                Tasks = [],
                Results = []
            });

        Func<Task<ReplayRunResult>> act = async () => await _sut.ReplayAsync("run-1");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*No tasks*");
    }
}
