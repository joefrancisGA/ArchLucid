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

    private sealed class RecordingRenewalScope : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        IAgentExecutor executor,
        IAgentResultRepository resultRepo,
        IRunExecuteOwnershipLeaseService ownershipLeaseService)
    {
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

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

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

        return ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
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
