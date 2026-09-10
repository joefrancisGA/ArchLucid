using ArchLucid.Application;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>TB-943 / TB-961: execute ownership acquire/release around <see cref="ArchitectureRunExecuteOrchestrator.ExecuteRunAsync"/>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorOwnershipTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteRunAsync_does_not_acquire_ownership_when_run_not_found()
    {
        Guid runGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        string runId = runGuid.ToString("N");

        Mock<IRunExecuteOwnershipLeaseService> ownership = CreateEnabledOwnershipMock(runGuid);

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ArchitectureRunExecuteOrchestrator sut = CreateSutWithRunRepo(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            ownership.Object,
            runRepo);

        Func<Task> act = () => sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<RunNotFoundException>();

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never,
            "execute ownership must not be acquired when the run id does not resolve to a persisted run");
    }

    [Fact]
    public async Task ExecuteRunAsync_does_not_acquire_ownership_when_authority_pipeline_is_complete()
    {
        Guid runGuid = Guid.Parse("99999999-9999-9999-9999-999999999999");
        string runId = runGuid.ToString("N");
        Guid goldenManifestId = Guid.Parse("11111111-2222-3333-4444-555555555555");

        Mock<IRunExecuteOwnershipLeaseService> ownership = CreateEnabledOwnershipMock(runGuid);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            ownership.Object,
            headerOverride: new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-ownership",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = goldenManifestId,
                PinnedPolicyPackIdsJson = "[]",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            succeededAuthorityStages: SucceededAuthorityStages());

        Func<Task> act = () => sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*authority-pipeline complete*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never,
            "execute ownership must not be acquired when authority pipeline completion blocks agent-task execute");
    }

    [Fact]
    public async Task ExecuteRunAsync_does_not_acquire_ownership_when_run_has_no_scheduled_tasks()
    {
        Guid runGuid = Guid.Parse("88888888-8888-8888-8888-888888888888");
        string runId = runGuid.ToString("N");

        Mock<IRunExecuteOwnershipLeaseService> ownership = CreateEnabledOwnershipMock(runGuid);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            ownership.Object,
            scheduledTasks: []);

        Func<Task> act = () => sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<NoScheduledAgentTasksException>().WithMessage("*No tasks found*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never,
            "execute ownership must not be acquired when the run has no agent tasks and no deferred context snapshot");
    }

    [Fact]
    public async Task ExecuteRunAsync_when_agent_execute_cancelled_releases_lease_with_non_cancellable_token()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string runId = runGuid.ToString("N");
        using CancellationTokenSource cts = new();
        CancellationToken? releaseToken = null;

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);
        ownership
            .Setup(s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ownership
            .Setup(s => s.BeginRenewalScope(runGuid, It.IsAny<CancellationTokenSource>()))
            .Returns(new RecordingRenewalScope(static () => { }));
        ownership
            .Setup(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()))
            .Callback<Guid, CancellationToken>((_, token) => releaseToken = token)
            .Returns(Task.CompletedTask);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cts.Token));

        ArchitectureRunExecuteOrchestrator sut = CreateSut(runId, runGuid, executor.Object, ownership.Object);

        Func<Task> act = () => sut.ExecuteRunAsync(runId, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();

        ownership.Verify(s => s.AcquireAsync(runGuid, cts.Token), Times.Once);
        ownership.Verify(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()), Times.Once);
        releaseToken.Should().Be(CancellationToken.None);
    }

    private sealed class RecordingRenewalScope(Action onDispose) : IAsyncDisposable
    {
        public ValueTask DisposeAsync()
        {
            onDispose();

            return ValueTask.CompletedTask;
        }
    }

    private static Mock<IRunExecuteOwnershipLeaseService> CreateEnabledOwnershipMock(Guid runGuid)
    {
        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);
        ownership
            .Setup(s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ownership
            .Setup(s => s.BeginRenewalScope(runGuid, It.IsAny<CancellationTokenSource>()))
            .Returns(new RecordingRenewalScope(static () => { }));
        ownership
            .Setup(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return ownership;
    }

    private static ArchitectureRunExecuteOrchestrator CreateSutWithRunRepo(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IRunExecuteOwnershipLeaseService ownershipLeaseService,
        Mock<IRunRepository> runRepo)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("ownership-test");

        return ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                ActorContext = actor.Object,
                BaselineMutationAuditService = Mock.Of<IBaselineMutationAuditService>(),
                PostExecuteHooks = ArchitectureRunExecuteOrchestratorTestFactory.CreatePostExecuteHooks(
                    scopeContextProvider: scopeProvider.Object,
                    runRepository: runRepo.Object),
                AgentExecutionOptions = Options.Create(new AgentExecutionOptions()),
                RunExecuteOwnershipLeaseService = ownershipLeaseService,
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance,
            });
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededAuthorityStages()
    {
        DateTime started = new(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc);

        return AuthorityPipelineStageNames.Sequence
            .Select(name => StageTimelineSummary.FromRow(
                name,
                started,
                started.AddMinutes(1),
                AuthorityPipelineStageNames.SucceededOutcomeStatus))
            .ToList();
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IRunExecuteOwnershipLeaseService ownershipLeaseService,
        RunRecord? headerOverride = null,
        IReadOnlyList<StageTimelineSummary>? succeededAuthorityStages = null,
        IReadOnlyList<AgentTask>? scheduledTasks = null)
    {
        RunRecord header = headerOverride ?? new RunRecord
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-ownership", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-ownership",
                Description = new string('x', 12),
                SystemName = "Ownership",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        IReadOnlyList<AgentTask> resolvedTasks = scheduledTasks
            ??
            [
                new AgentTask { RunId = runId, AgentType = AgentType.Topology, TaskId = "topology-task-ownership" },
            ];
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedTasks);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync([]);

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("ownership-test");

        Mock<IRunStageOutcomesRepository> stagesRepo = new();
        stagesRepo
            .Setup(r => r.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(succeededAuthorityStages ?? []);

        return ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = Mock.Of<IAgentEvaluationService>(),
                AgentResultRepository = resultRepo.Object,
                AgentEvaluationRepository = Mock.Of<IAgentEvaluationRepository>(),
                AgentEvidencePackageRepository = Mock.Of<IAgentEvidencePackageRepository>(),
                EvidenceBuilder = new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
                ActorContext = actor.Object,
                BaselineMutationAuditService = Mock.Of<IBaselineMutationAuditService>(),
                PostExecuteHooks = ArchitectureRunExecuteOrchestratorTestFactory.CreatePostExecuteHooks(
                scopeContextProvider: scopeProvider.Object,
                runRepository: runRepo.Object),
                UnitOfWorkFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
                OutputTraceEvaluationHook = Mock.Of<IAgentOutputTraceEvaluationHook>(),
                AgentResultPostExecutionEnricher = new NoOpAgentResultPostExecutionEnricher(),
                EvidencePackageInjectionMitigator = new NoOpEvidencePackageInjectionMitigator(),
                AgentEvidenceUntrustedInputSanitizer = new NoOpAgentEvidenceUntrustedInputSanitizer(),
                RequestContentSafetyPrecheck = safety.Object,
                AgentExecutionOptions = Options.Create(new AgentExecutionOptions()),
                EffectiveAgentExecutionModeAccessor = new FixedEffectiveAgentExecutionModeAccessor(),
                AgentOutputQualityGateOptions = Options.Create(new AgentOutputQualityGateOptions()),
                RunStateTransitionService = new RunStateTransitionService(),
                RunEngineProvenanceCaptureService = Mock.Of<IRunEngineProvenanceCaptureService>(),
                ExecuteTimeGovernanceScopeCaptureService = Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
                TopologyProposalSeeder = ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
                DemoExpensiveActionGate = ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
                RunScopedLlmBudgetReservationService = ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
                OperationCancellationRegistry = new OperationCancellationRegistry(),
                RunCancellationMarker = new OperationRunCancellationMarker(runRepo.Object),
                RunExecuteOwnershipLeaseService = ownershipLeaseService,
                RunStageOutcomesRepository = stagesRepo.Object,
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance
            });;
    }
}
