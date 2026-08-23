using ArchLucid.Application;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
///     Run-level multi-agent failure scenarios (TB-945). Complements transport Simmy chaos in
///     <c>ArchLucid.AgentRuntime.Tests</c> and poison-cache admission tests (TB-940).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
[Trait("ChaosSuite", "TB-945")]
public sealed class MultiAgentFailureModeChaosSuiteTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly RunStateTransitionService TransitionService = new();

    [Fact]
    public async Task TB937_incomplete_quad_agent_batch_sets_PartiallyCompleted_and_blocks_commit()
    {
        Guid runGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        string runId = runGuid.ToString("N");
        string topologyTaskId = "task-topo";

        PartialBatchExecutor executor = new(
            runId,
            [MakeAgentTask(runId, topologyTaskId, AgentType.Topology)]);

        string? capturedLegacyStatus = null;
        Mock<IRunRepository> runRepo = CreateRunRepo(runGuid, nameof(ArchitectureRunStatus.TasksGenerated), status => capturedLegacyStatus = status);
        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor,
            new InMemoryAgentResultRepository(new InMemoryAgentResultEnrichmentRepository()),
            runRepo.Object,
            AllQuadAgentTasks(runId));

        ExecuteRunResult result = await sut.ExecuteRunAsync(runId);

        result.Results.Should().HaveCount(1);
        result.Results[0].AgentType.Should().Be(AgentType.Topology);

        capturedLegacyStatus.Should().Be(nameof(ArchitectureRunStatus.PartiallyCompleted));

        TransitionService.ValidateCommitAllowed(ArchitectureRunStatus.PartiallyCompleted).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task TB939_mid_run_budget_deny_persists_topology_and_sets_FailedPartial()
    {
        Guid runGuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string runId = runGuid.ToString("N");

        AgentResult topologyResult = SuccessfulResult(runId, "task-topo", AgentType.Topology);
        AgentRunPartialBudgetException partialException =
            new(new CostLimitExceededException("Run budget exceeded"), [topologyResult]);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(partialException);

        InMemoryAgentResultRepository resultRepo = new(new InMemoryAgentResultEnrichmentRepository());
        string? capturedLegacyStatus = null;
        Mock<IRunRepository> runRepo = CreateRunRepo(runGuid, nameof(ArchitectureRunStatus.TasksGenerated), status => capturedLegacyStatus = status);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            resultRepo,
            runRepo.Object,
            AllQuadAgentTasks(runId),
            gateOptions: new AgentOutputQualityGateOptions { PersistPartialOutputsOnBudgetExceeded = true });

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<RunCostBudgetExceededPartialPersistRecordedException>();

        capturedLegacyStatus.Should().Be(nameof(ArchitectureRunStatus.FailedPartial));

        IReadOnlyList<AgentResult> stored = await resultRepo.GetByRunIdAsync(TestScope, runId, CancellationToken.None);
        stored.Should().ContainSingle(r => r.AgentType == AgentType.Topology);

        TransitionService.ValidateCommitAllowed(ArchitectureRunStatus.FailedPartial).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task TB939_pre_batch_budget_deny_does_not_invoke_executor()
    {
        Guid runGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string runId = runGuid.ToString("N");

        CountingExecutor executor = new();
        DenyingRunScopedBudgetService budget = new(RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor,
            new InMemoryAgentResultRepository(new InMemoryAgentResultEnrichmentRepository()),
            CreateRunRepo(runGuid, nameof(ArchitectureRunStatus.TasksGenerated)).Object,
            AllQuadAgentTasks(runId),
            budgetService: budget);

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<CostLimitExceededException>();

        executor.InvocationCount.Should().Be(0);
        budget.ReleaseCount.Should().Be(0);
        budget.CommitCount.Should().Be(0);
    }

    [Fact]
    public async Task TB939_executor_failure_releases_held_reservation_without_commit()
    {
        Guid runGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string runId = runGuid.ToString("N");

        CountingExecutor executor = new(shouldThrow: true);
        TrackingRunScopedBudgetService budget = new();

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor,
            new InMemoryAgentResultRepository(new InMemoryAgentResultEnrichmentRepository()),
            CreateRunRepo(runGuid, nameof(ArchitectureRunStatus.TasksGenerated)).Object,
            AllQuadAgentTasks(runId),
            budgetService: budget);

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<AgentExecutionFailedException>();

        budget.CommitCount.Should().Be(0);
        budget.ReleaseCount.Should().Be(1);
    }

    [Fact]
    public async Task TB938_selective_resume_skips_persisted_topology_and_re_invokes_only_failed_agents()
    {
        Guid runGuid = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string runId = runGuid.ToString("N");
        string topologyTaskId = "task-topo";
        string costTaskId = "task-cost";
        string complianceTaskId = "task-comp";
        string criticTaskId = "task-critic";

        AgentResult topologyResult = SuccessfulResult(runId, topologyTaskId, AgentType.Topology);
        AgentResult complianceResult = SuccessfulResult(runId, complianceTaskId, AgentType.Compliance);
        AgentResult staleCritic = SuccessfulResult(runId, criticTaskId, AgentType.Critic);

        InMemoryAgentResultRepository resultRepo = new(new InMemoryAgentResultEnrichmentRepository());
        await resultRepo.CreateManyAsync([topologyResult, complianceResult, staleCritic], CancellationToken.None);

        CountingExecutor inner = new();
        IdempotentAgentExecutorWrapper idempotent = new(inner, resultRepo);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            idempotent,
            resultRepo,
            CreateRunRepo(runGuid, nameof(ArchitectureRunStatus.PartiallyCompleted)).Object,
            [
                MakeAgentTask(runId, topologyTaskId, AgentType.Topology),
                MakeAgentTask(runId, costTaskId, AgentType.Cost),
                MakeAgentTask(runId, complianceTaskId, AgentType.Compliance),
                MakeAgentTask(runId, criticTaskId, AgentType.Critic),
            ]);

        ExecuteRunResult result = await sut.ExecuteSelectiveRunAsync(
            runId,
            new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        inner.InvokedAgentTypes.Should().BeEquivalentTo([AgentType.Cost, AgentType.Critic]);
        inner.InvokedAgentTypes.Should().NotContain(AgentType.Topology);

        IReadOnlyList<AgentResult> stored = await resultRepo.GetByRunIdAsync(TestScope, runId, CancellationToken.None);
        stored.Should().Contain(r => r.TaskId == topologyTaskId && r.ResultId == topologyResult.ResultId);
        stored.Should().Contain(r => r.TaskId == costTaskId);
        stored.Should().Contain(r => r.TaskId == criticTaskId && r.ResultId != staleCritic.ResultId);

        result.Results.Should().HaveCount(4);
    }

    private static IReadOnlyList<AgentTask> AllQuadAgentTasks(string runId) =>
    [
        MakeAgentTask(runId, "task-topo", AgentType.Topology),
        MakeAgentTask(runId, "task-cost", AgentType.Cost),
        MakeAgentTask(runId, "task-comp", AgentType.Compliance),
        MakeAgentTask(runId, "task-critic", AgentType.Critic),
    ];

    private static Mock<IRunRepository> CreateRunRepo(
        Guid runGuid,
        string initialLegacyStatus,
        Action<string?>? onLegacyStatusUpdated = null)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-chaos",
            LegacyRunStatus = initialLegacyStatus,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) => onLegacyStatusUpdated?.Invoke(record.LegacyRunStatus))
            .Returns(Task.CompletedTask);

        return runRepo;
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IAgentResultRepository resultRepo,
        IRunRepository runRepo,
        IReadOnlyList<AgentTask> tasks,
        AgentOutputQualityGateOptions? gateOptions = null,
        IRunScopedLlmBudgetReservationService? budgetService = null)
    {
        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-chaos", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-chaos",
                Description = new string('x', 12),
                SystemName = "ChaosSuite",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("chaos-suite-actor");

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<AgentEvidencePackage>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        evalRepo
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IReadOnlyCollection<AgentEvaluationRecord>>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvaluationService> evaluationService = new();
        evaluationService
            .Setup(e => e.EvaluateAsync(
                runId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureRunExecuteOrchestratorTailDependencies tail =
            ArchitectureRunExecuteOrchestratorTestFactory.CreateStandardTailDependencies(
                scopeProvider.Object,
                runRepo);

        return new ArchitectureRunExecuteOrchestrator(
            runRepo,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            evaluationService.Object,
            resultRepo,
            evalRepo.Object,
            evidenceRepo.Object,
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            actorContext.Object,
            baselineAudit.Object,
            audit.Object,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions()),
            Options.Create(gateOptions ?? new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            Mock.Of<IRunEngineProvenanceCaptureService>(),
            Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
            tail.TopologyProposalSeeder,
            tail.DemoExpensiveActionGate,
            budgetService ?? tail.RunScopedLlmBudgetReservationService,
            tail.OperationCancellationRegistry,
            tail.RunCancellationMarker,
            tail.RunExecuteOwnershipLeaseService,
            tail.RunStageOutcomesRepository,
            tail.IntegrationEventOutbox,
            tail.IntegrationEventPublisher,
            tail.IntegrationEventsOptions,
            tail.Logger);
    }

    private static AgentTask MakeAgentTask(string runId, string taskId, AgentType agentType) =>
        new()
        {
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
        };

    private static AgentResult SuccessfulResult(string runId, string taskId, AgentType agentType) =>
        new()
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
            Confidence = 0.9,
            Claims = ["ok"],
            EvidenceRefs = ["e"],
            Findings = [],
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

    private sealed class PartialBatchExecutor(string runId, IReadOnlyList<AgentTask> tasksToReturn) : IAgentExecutor
    {
        public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
            string executeRunId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            IReadOnlyCollection<AgentTask> tasks,
            CancellationToken cancellationToken = default)
        {
            List<AgentResult> results = tasksToReturn
                .Select(task => SuccessfulResult(runId, task.TaskId, task.AgentType))
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentResult>>(results);
        }
    }

    private sealed class CountingExecutor(bool shouldThrow = false) : IAgentExecutor
    {
        public int InvocationCount { get; private set; }

        public List<AgentType> InvokedAgentTypes { get; } = [];

        public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            IReadOnlyCollection<AgentTask> tasks,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;

            if (shouldThrow)
            {
                throw new AgentExecutionFailedException(
                    runId,
                    taskId: null,
                    new InvalidOperationException("simulated agent batch failure"));
            }

            foreach (AgentTask task in tasks)
                InvokedAgentTypes.Add(task.AgentType);

            List<AgentResult> results = tasks
                .Select(task => SuccessfulResult(runId, task.TaskId, task.AgentType))
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentResult>>(results);
        }
    }

    private sealed class DenyingRunScopedBudgetService(RunScopedLlmBudgetAdmitRejectionReason reason)
        : IRunScopedLlmBudgetReservationService
    {
        public int CommitCount { get; private set; }

        public int ReleaseCount { get; private set; }

        public Task<RunScopedLlmBudgetAdmitResult> AdmitBeforeAgentBatchAsync(
            Guid tenantId,
            string runId,
            int agentTaskCount,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(RunScopedLlmBudgetAdmitResult.Reject(reason));

        public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
        {
            CommitCount++;
            return Task.CompletedTask;
        }

        public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
        {
            ReleaseCount++;
            return Task.CompletedTask;
        }
    }

    private sealed class TrackingRunScopedBudgetService : IRunScopedLlmBudgetReservationService
    {
        private static readonly Guid ReservationId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        public int CommitCount { get; private set; }

        public int ReleaseCount { get; private set; }

        public Task<RunScopedLlmBudgetAdmitResult> AdmitBeforeAgentBatchAsync(
            Guid tenantId,
            string runId,
            int agentTaskCount,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(RunScopedLlmBudgetAdmitResult.Permit(ReservationId, 1m));

        public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
        {
            CommitCount++;
            return Task.CompletedTask;
        }

        public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
        {
            ReleaseCount++;
            return Task.CompletedTask;
        }
    }

    private sealed class IdempotentAgentExecutorWrapper(
        IAgentExecutor inner,
        IAgentResultRepository resultRepository) : IAgentExecutor
    {
        public async Task<IReadOnlyList<AgentResult>> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            IReadOnlyCollection<AgentTask> tasks,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<AgentResult> persisted =
                await resultRepository.GetByRunIdAsync(TestScope, runId, cancellationToken);

            Dictionary<string, AgentResult> byTask = persisted
                .GroupBy(static r => r.TaskId, StringComparer.Ordinal)
                .ToDictionary(static g => g.Key, static g => g.OrderByDescending(x => x.CreatedUtc).First(), StringComparer.Ordinal);

            List<AgentTask> toRun = [];
            Dictionary<string, AgentResult> skipped = new(StringComparer.Ordinal);

            foreach (AgentTask task in tasks)
            {
                if (byTask.TryGetValue(task.TaskId, out AgentResult? existing)
                    && AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(existing, out _))
                {
                    skipped[task.TaskId] = existing;
                    continue;
                }

                toRun.Add(task);
            }

            IReadOnlyList<AgentResult> fresh = toRun.Count == 0
                ? []
                : await inner.ExecuteAsync(runId, request, evidence, toRun, cancellationToken);

            Dictionary<string, AgentResult> freshByTask =
                fresh.ToDictionary(static r => r.TaskId, StringComparer.Ordinal);

            List<AgentResult> merged = [];

            foreach (AgentTask task in tasks)
            {
                if (skipped.TryGetValue(task.TaskId, out AgentResult? kept))
                {
                    merged.Add(kept);
                    continue;
                }

                merged.Add(freshByTask[task.TaskId]);
            }

            return merged;
        }
    }
}
