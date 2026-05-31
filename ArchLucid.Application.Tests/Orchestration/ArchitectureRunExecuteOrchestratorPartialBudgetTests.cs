using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Core.Evidence;
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
public sealed class ArchitectureRunExecuteOrchestratorPartialBudgetTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteRunAsync_persists_partial_results_and_records_failure_when_budget_exceeded()
    {
        Guid runGuid = Guid.Parse("33333333-4444-5555-6666-777777777777");
        string runId = runGuid.ToString("N");
        List<AgentResult> partialResults =
        [
            new AgentResult
            {
                RunId = runId,
                AgentType = AgentType.Topology,
                TaskId = Guid.NewGuid().ToString("N"),
                Claims = ["c"],
                EvidenceRefs = ["e"],
                Confidence = 0.9,
            },
        ];

        AgentRunPartialBudgetException partialException =
            new(new CostLimitExceededException("Run budget exceeded"), partialResults);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(partialException);

        Mock<IAgentEvaluationService> evaluationService = new();
        evaluationService
            .Setup(e => e.EvaluateAsync(
                runId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                partialResults,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);
        resultRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<AgentResult>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
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

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            executor.Object,
            evaluationService.Object,
            resultRepo.Object,
            baselineAudit.Object,
            new AgentOutputQualityGateOptions { PersistPartialOutputsOnBudgetExceeded = true });

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<RunCostBudgetExceededPartialPersistRecordedException>();

        resultRepo.Verify(
            r => r.CreateAsync(
                It.Is<AgentResult>(result => partialResults.Any(p => p.TaskId == result.TaskId)),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);

        baselineAudit.Verify(
            b => b.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                It.IsAny<string>(),
                runId,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IAgentEvaluationService evaluationService,
        IAgentResultRepository resultRepo,
        IBaselineMutationAuditService baselineAudit,
        AgentOutputQualityGateOptions gateOptions)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-partial-budget",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-partial-budget", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-partial-budget",
                Description = new string('x', 12),
                SystemName = "PartialBudget",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentTask
                {
                    RunId = runId,
                    AgentType = AgentType.Topology,
                    TaskId = Guid.NewGuid().ToString("N"),
                },
            ]);

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("partial-budget-actor");

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

        return new ArchitectureRunExecuteOrchestrator(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            evaluationService,
            resultRepo,
            evalRepo.Object,
            evidenceRepo.Object,
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            actorContext.Object,
            baselineAudit,
            Mock.Of<IAuditService>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions()),
            Options.Create(gateOptions),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }
}
