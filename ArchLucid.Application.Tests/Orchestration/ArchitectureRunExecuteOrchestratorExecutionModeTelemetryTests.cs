using System.Diagnostics;

using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Core.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
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

[Collection("ArchLucidInstrumentation")]
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorExecutionModeTelemetryTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [SkippableTheory]
    [InlineData("Simulator", AgentOutputQualityGateTelemetry.ExecutionModeSimulator)]
    [InlineData("Real", AgentOutputQualityGateTelemetry.ExecutionModeReal)]
    public async Task ExecuteRunAsync_sets_archlucid_execution_mode_on_run_activity(
        string configuredMode,
        string expectedLabel)
    {
        System.Runtime.CompilerServices.RuntimeHelpers.RunClassConstructor(typeof(ArchLucid.Core.Diagnostics.ArchLucidInstrumentation).TypeHandle);

        List<Activity> captured = [];

        using ActivityListener listener = new()
        {
            ShouldListenTo = static source => source.Name == ArchLucidMeterNames.AgentExecutionActivitySource,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
            ActivityStarted = captured.Add,
        };

        ActivitySource.AddActivityListener(listener);

        Guid runGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string runId = runGuid.ToString("N");

        List<AgentResult> agentResults =
        [
            new AgentResult
            {
                RunId = runId,
                TaskId = "task-exec-mode",
                AgentType = AgentType.Topology,
                Claims = ["ok"],
                EvidenceRefs = ["ev-1"],
                Confidence = 0.8,
            },
        ];

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(agentResults);

        ArchitectureRunExecuteOrchestrator sut = CreateSut(runId, runGuid, executor.Object, configuredMode);

        ExecuteRunResult result = await sut.ExecuteRunAsync(runId);

        result.Results.Should().ContainSingle();

        Activity runActivity = captured.Where(a => a.GetTagItem("archlucid.run_id") as string == runId).Should()
            .ContainSingle(a => a.OperationName == "architecture.run.execute")
            .Subject;

        runActivity.GetTagItem("archlucid.execution_mode").Should().Be(expectedLabel);
        runActivity.GetTagItem("archlucid.run_id").Should().Be(runId);
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        string executionMode)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-exec-mode",
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
            .Setup(r => r.GetByIdAsync("req-exec-mode", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-exec-mode",
                Description = new string('x', 12),
                SystemName = "ExecMode",
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
                    TaskId = "task-exec-mode",
                },
            ]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);
        resultRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<AgentResult>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
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

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("exec-mode-actor");

        return new ArchitectureRunExecuteOrchestrator(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            evaluationService.Object,
            resultRepo.Object,
            Mock.Of<IAgentEvaluationRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            actorContext.Object,
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions { Mode = executionMode }),
            Options.Create(new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }
}
