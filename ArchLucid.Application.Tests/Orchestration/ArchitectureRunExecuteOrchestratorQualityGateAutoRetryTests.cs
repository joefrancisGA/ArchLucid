using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
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

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorQualityGateAutoRetryTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [SkippableFact]
    public async Task ExecuteRunAsync_when_quality_gate_rejects_once_then_succeeds_on_auto_retry()
    {
        Guid runGuid = Guid.Parse("22222222-3333-4444-5555-666666666666");
        string runId = runGuid.ToString("N");
        string topologyTaskId = Guid.NewGuid().ToString("N");

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-qgate-retry",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-qgate-retry",
            Description = new string('x', 12),
            SystemName = "QGateRetry",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        AgentTask topologyTask = new()
        {
            RunId = runId,
            AgentType = AgentType.Topology,
            TaskId = topologyTaskId,
        };

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([topologyTask]);

        IReadOnlyList<AgentResult> batchResults =
        [
            new AgentResult
            {
                RunId = runId,
                AgentType = AgentType.Topology,
                TaskId = topologyTaskId,
                ResultId = Guid.NewGuid().ToString("N"),
                Claims = ["c"],
                EvidenceRefs = ["e"],
                Confidence = 0.9,
            },
        ];

        AgentResult retryResult = new()
        {
            RunId = runId,
            AgentType = AgentType.Topology,
            TaskId = topologyTaskId,
            ResultId = Guid.NewGuid().ToString("N"),
            Claims = ["c2"],
            EvidenceRefs = ["e2"],
            Confidence = 0.95,
        };

        int executeCalls = 0;
        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                request,
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                executeCalls++;
                return executeCalls == 1 ? batchResults : (IReadOnlyList<AgentResult>)[retryResult];
            });

        Mock<IAgentEvaluationService> evaluationService = new();
        evaluationService
            .Setup(e => e.EvaluateAsync(
                runId,
                request,
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<IReadOnlyCollection<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);
        resultRepo
            .Setup(r => r.CreateManyAsync(It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        resultRepo
            .Setup(r => r.ReplaceForRunTaskAsync(retryResult, It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        evalRepo
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IReadOnlyCollection<AgentEvaluationRecord>>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<AgentEvidencePackage>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("qgate-retry-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IUnifiedGoldenManifestReader> manifestReader = new(MockBehavior.Strict);

        int hookCalls = 0;
        Mock<IAgentOutputTraceEvaluationHook> traceHook = new();
        traceHook
            .Setup(h => h.AfterSuccessfulExecuteAsync(runId, It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                hookCalls++;

                if (hookCalls == 1)
                    throw new AgentOutputQualityGateRejectedException(runId, "tr-retry-1", nameof(AgentType.Topology));

                return Task.CompletedTask;
            });

        IOptions<AgentOutputQualityGateOptions> gateOptions = Options.Create(new AgentOutputQualityGateOptions
        {
            BlockRunOnReject = true,
            EnforceOnReject = true,
            MaxAutoRetries = 1,
        });

        ArchitectureRunExecuteOrchestrator sut = new(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor.Object,
            evaluationService.Object,
            resultRepo.Object,
            evalRepo.Object,
            evidenceRepo.Object,
            new DefaultEvidenceBuilder(manifestReader.Object),
            actorContext.Object,
            baselineAudit.Object,
            auditService.Object,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            traceHook.Object,
            new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions()),
            gateOptions,
            new RunStateTransitionService(),
            Mock.Of<IRunEngineProvenanceCaptureService>(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runRepo.Object),
            new DisabledRunExecuteOwnershipLeaseService(),
            Mock.Of<IRunStageOutcomesRepository>(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);

        ExecuteRunResult result = await sut.ExecuteRunAsync(runId);

        result.Results.Should().ContainSingle(r => r.TaskId == topologyTaskId && r.Confidence == 0.95);
        hookCalls.Should().Be(2);
        resultRepo.Verify(
            r => r.ReplaceForRunTaskAsync(retryResult, It.IsAny<CancellationToken>(), null, null),
            Times.Once);
        baselineAudit.Verify(
            b => b.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
                It.IsAny<string>(),
                runId,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
