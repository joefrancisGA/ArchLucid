using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
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

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorSelectiveOwnershipTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteSelectiveRunAsync_acquires_ownership_before_deleting_forced_task_results()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = runGuid.ToString("N");
        List<string> operationOrder = [];

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);
        ownership
            .Setup(s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()))
            .Callback(() => operationOrder.Add("acquire"))
            .Returns(Task.CompletedTask);
        ownership
            .Setup(s => s.BeginRenewalScope(runGuid, It.IsAny<CancellationTokenSource>()))
            .Returns(new RecordingRenewalScope());
        ownership
            .Setup(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync([]);
        resultRepo
            .Setup(r => r.DeleteForRunTaskAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback(() => operationOrder.Add("delete"))
            .Returns(Task.CompletedTask);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(runId, runGuid, executor.Object, resultRepo.Object, ownership.Object);

        try
        {
            await sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });
        }
        catch (Exception)
        {
            // Full execute persistence is not under test; ordering is recorded before agent batch completes.
        }

        operationOrder.Should().ContainInOrder("acquire", "delete");
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_delete_results_when_run_becomes_committed_before_prep()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string runId = runGuid.ToString("N");

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);
        ownership
            .Setup(s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()))
            .Callback(() => header.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed))
            .Returns(Task.CompletedTask);
        ownership
            .Setup(s => s.BeginRenewalScope(runGuid, It.IsAny<CancellationTokenSource>()))
            .Returns(new RecordingRenewalScope());
        ownership
            .Setup(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync([]);

        Mock<IAgentExecutor> executor = new();

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            resultRepo.Object,
            ownership.Object,
            header);

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*committed*");

        resultRepo.Verify(
            r => r.DeleteForRunTaskAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_no_scheduled_tasks_even_with_deferred_context()
    {
        Guid runGuid = Guid.Parse("12121212-1212-1212-1212-121212121212");
        string runId = runGuid.ToString("N");

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentExecutor> executor = new();

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            Mock.Of<IAgentResultRepository>(),
            ownership.Object,
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-selective-ownership",
                LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
                ContextSnapshotId = Guid.Parse("13131313-1313-1313-1313-131313131313"),
                PinnedPolicyPackIdsJson = "[]",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            taskRepo: taskRepo);

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<NoScheduledAgentTasksException>().WithMessage("*No tasks found*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never,
            "selective execute requires scheduled tasks to resolve a force list; deferred context alone is full-execute only");
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_delete_results_when_forced_tasks_no_longer_match_live_schedule()
    {
        Guid runGuid = Guid.Parse("abababab-abab-abab-abab-abababababab");
        string runId = runGuid.ToString("N");
        int taskLoadCount = 0;

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);
        ownership
            .Setup(s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ownership
            .Setup(s => s.BeginRenewalScope(runGuid, It.IsAny<CancellationTokenSource>()))
            .Returns(new RecordingRenewalScope());
        ownership
            .Setup(s => s.ReleaseAsync(runGuid, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                taskLoadCount++;

                return taskLoadCount == 1
                    ?
                    [
                        new AgentTask { RunId = runId, AgentType = AgentType.Cost, TaskId = "cost-task-stale" },
                    ]
                    : [];
            });

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync([]);
        resultRepo
            .Setup(r => r.DeleteForRunTaskAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentExecutor> executor = new();

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            resultRepo.Object,
            ownership.Object,
            taskRepo: taskRepo);

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<Exception>();

        resultRepo.Verify(
            r => r.DeleteForRunTaskAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_live_schedule_clears_before_acquire()
    {
        Guid runGuid = Guid.Parse("bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc");
        string runId = runGuid.ToString("N");
        int taskLoadCount = 0;

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                taskLoadCount++;

                return taskLoadCount == 1
                    ?
                    [
                        new AgentTask { RunId = runId, AgentType = AgentType.Cost, TaskId = "cost-task-stale" },
                    ]
                    : [];
            });

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            Mock.Of<IAgentResultRepository>(),
            ownership.Object,
            taskRepo: taskRepo);

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<NoScheduledAgentTasksException>().WithMessage("*No tasks found*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_run_becomes_committed_before_acquire()
    {
        Guid runGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        string runId = runGuid.ToString("N");
        int loadCount = 0;

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        Mock<IAgentResultRepository> resultRepo = new();
        Mock<IAgentExecutor> executor = new();

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            resultRepo.Object,
            ownership.Object,
            header,
            () =>
            {
                loadCount++;

                if (loadCount >= 2)
                    header.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            });

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*committed*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_live_schedule_clears_after_force_validation()
    {
        Guid runGuid = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
        string runId = runGuid.ToString("N");
        int taskLoadCount = 0;

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                taskLoadCount++;

                return taskLoadCount <= 2
                    ?
                    [
                        new AgentTask { RunId = runId, AgentType = AgentType.Cost, TaskId = "cost-task-stale" },
                    ]
                    : [];
            });

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            Mock.Of<IAgentResultRepository>(),
            ownership.Object,
            taskRepo: taskRepo);

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<NoScheduledAgentTasksException>().WithMessage("*No tasks found*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_run_commits_after_force_validation()
    {
        Guid runGuid = Guid.Parse("10101010-1010-1010-1010-101010101010");
        string runId = runGuid.ToString("N");
        int loadCount = 0;

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            Mock.Of<IAgentResultRepository>(),
            ownership.Object,
            header,
            () =>
            {
                loadCount++;

                if (loadCount >= 3)
                    header.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            });

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*committed*");

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_does_not_acquire_ownership_when_run_deleted_after_force_validation()
    {
        Guid runGuid = Guid.Parse("20202020-2020-2020-2020-202020202020");
        string runId = runGuid.ToString("N");
        int runLoadCount = 0;

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunExecuteOwnershipLeaseService> ownership = new();
        ownership.SetupGet(s => s.IsEnabled).Returns(true);

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                runLoadCount++;

                return runLoadCount <= 3 ? header : null;
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-selective-ownership", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-selective-ownership",
                Description = new string('x', 12),
                SystemName = "SelectiveOwnership",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentTask { RunId = runId, AgentType = AgentType.Cost, TaskId = "cost-task-ownership" },
            ]);

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("selective-ownership-test");

        ArchitectureRunExecuteOrchestrator sut = ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            Mock.Of<IAgentExecutor>(),
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = Mock.Of<IAgentEvaluationService>(),
                AgentResultRepository = Mock.Of<IAgentResultRepository>(),
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
                RunExecuteOwnershipLeaseService = ownership.Object,
                RunStageOutcomesRepository = Mock.Of<IRunStageOutcomesRepository>(),
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance
            });

        Func<Task> act = () => sut.ExecuteSelectiveRunAsync(runId, new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<RunNotFoundException>();

        ownership.Verify(
            s => s.AcquireAsync(runGuid, It.IsAny<CancellationToken>()),
            Times.Never,
            "vanished run must be detected immediately before ownership acquire, not only on owned-core reload after acquire");
    }

    private sealed class RecordingRenewalScope : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IAgentResultRepository resultRepo,
        IRunExecuteOwnershipLeaseService ownershipLeaseService,
        RunRecord? header = null,
        Action? onRunRecordLoad = null,
        Mock<IAgentTaskRepository>? taskRepo = null)
    {
        header ??= new RunRecord
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective-ownership",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                onRunRecordLoad?.Invoke();

                return header;
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-selective-ownership", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-selective-ownership",
                Description = new string('x', 12),
                SystemName = "SelectiveOwnership",
            });

        Mock<IAgentTaskRepository> resolvedTaskRepo = taskRepo ?? new Mock<IAgentTaskRepository>();

        if (taskRepo is null)
        {
            resolvedTaskRepo
                .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                [
                    new AgentTask { RunId = runId, AgentType = AgentType.Cost, TaskId = "cost-task-ownership" },
                ]);
        }

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("selective-ownership-test");

        return ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            resolvedTaskRepo.Object,
            executor,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = Mock.Of<IAgentEvaluationService>(),
                AgentResultRepository = resultRepo,
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
                RunStageOutcomesRepository = Mock.Of<IRunStageOutcomesRepository>(),
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance
            });
    }
}
