using ArchLucid.Application;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
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
public sealed class ArchitectureRunExecuteOrchestratorAuthorityCompletenessTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteRunAsync_refuses_when_authority_pipeline_is_complete()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string runId = runGuid.ToString("N");
        Guid goldenId = Guid.Parse("11111111-2222-3333-4444-555555555555");

        Mock<IAgentExecutor> executor = new();
        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            nameof(ArchitectureRunStatus.Committed),
            goldenId,
            SucceededStages(),
            existingResults: [],
            executor.Object);

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*authority-pipeline complete*");
        executor.Verify(
            e => e.ExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        string legacyStatus,
        Guid? goldenManifestId,
        IReadOnlyList<StageTimelineSummary> stages,
        IReadOnlyList<AgentResult> existingResults,
        IAgentExecutor executor)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-authority",
            LegacyRunStatus = legacyStatus,
            GoldenManifestId = goldenManifestId,
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
            .Setup(r => r.GetByIdAsync("req-authority", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-authority",
                Description = new string('x', 12),
                SystemName = "AuthorityComplete",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync(existingResults);

        Mock<IRunStageOutcomesRepository> stagesRepo = new();
        stagesRepo
            .Setup(r => r.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(stages);

        return new ArchitectureRunExecuteOrchestrator(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            Mock.Of<IAgentEvaluationService>(),
            resultRepo.Object,
            Mock.Of<IAgentEvaluationRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            Mock.Of<IActorContext>(),
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            Mock.Of<IRequestContentSafetyPrecheck>(),
            Options.Create(new AgentExecutionOptions()),
            new FixedEffectiveAgentExecutionModeAccessor(),
            Options.Create(new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            Mock.Of<IRunEngineProvenanceCaptureService>(),
            Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runRepo.Object),
            new DisabledRunExecuteOwnershipLeaseService(),
            stagesRepo.Object,
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventOutbox(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventPublisher(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventsOptionsMonitor(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededStages()
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
}
