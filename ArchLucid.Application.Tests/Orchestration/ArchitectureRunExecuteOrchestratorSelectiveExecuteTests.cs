using ArchLucid.Application;
using ArchLucid.Application.Agents.Evidence;
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
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorSelectiveExecuteTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteSelectiveRunAsync_clears_cost_and_critic_keeps_topology_and_does_not_re_invoke_topology_via_idempotent_executor()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
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

        CountingInnerExecutor inner = new();
        IdempotentAgentExecutorWrapper idempotent = new(inner, resultRepo);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            idempotent,
            resultRepo,
            audit.Object,
            ArchitectureRunStatus.PartiallyCompleted,
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

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.Run.SelectiveExecuteRequested),
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteSelectiveRunAsync_rejects_committed_run()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string runId = runGuid.ToString("N");

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            Mock.Of<IAgentExecutor>(),
            new InMemoryAgentResultRepository(new InMemoryAgentResultEnrichmentRepository()),
            Mock.Of<IAuditService>(),
            ArchitectureRunStatus.Committed,
            [MakeAgentTask(runId, "t1", AgentType.Cost)]);

        Func<Task> act = async () => await sut.ExecuteSelectiveRunAsync(
            runId,
            new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*committed*");
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IAgentResultRepository resultRepo,
        IAuditService auditService,
        ArchitectureRunStatus status,
        IReadOnlyList<AgentTask> tasks)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-selective",
            LegacyRunStatus = status.ToString(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-selective", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-selective",
                Description = new string('x', 12),
                SystemName = "Selective",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("selective-actor");

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<AgentEvidencePackage>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        evalRepo
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IReadOnlyCollection<AgentEvaluationRecord>>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

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
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        return new ArchitectureRunExecuteOrchestrator(
            runRepo.Object,
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
            auditService,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            Mock.Of<IRunEngineProvenanceCaptureService>(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(scopeProvider.Object),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runRepo.Object),
            DisabledRunExecuteOwnershipLeaseService.Instance,
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
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

    private sealed class CountingInnerExecutor : IAgentExecutor
    {
        public List<AgentType> InvokedAgentTypes { get; } = [];

        public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            IReadOnlyCollection<AgentTask> tasks,
            CancellationToken cancellationToken = default)
        {
            foreach (AgentTask task in tasks)
                InvokedAgentTypes.Add(task.AgentType);

            List<AgentResult> results = tasks
                .Select(task => SuccessfulResult(runId, task.TaskId, task.AgentType))
                .ToList();

            return System.Threading.Tasks.Task.FromResult<IReadOnlyList<AgentResult>>(results);
        }
    }

    /// <summary>
    ///     Thin test double mirroring <c>IdempotentAgentExecutor</c> skip semantics without AgentRuntime project reference.
    /// </summary>
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
