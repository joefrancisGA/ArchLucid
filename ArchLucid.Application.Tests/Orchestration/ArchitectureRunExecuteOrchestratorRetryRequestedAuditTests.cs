using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
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
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
///     Durable <see cref="IAuditService.LogAsync" /> when execute is invoked for a run whose authority status is
///     <see cref="ArchitectureRunStatus.Failed" /> (retry signal before baseline <c>Architecture.RunStarted</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorRetryRequestedAuditTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [SkippableFact]
    public async Task ExecuteRunAsync_when_run_failed_emits_retry_requested_before_failing_execute_path()
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
            ArchitectureRequestId = "req-retry-audit",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-retry-audit",
            Description = new string('x', 12),
            SystemName = "RetryAudit",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo.Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IAgentExecutor> executor = new();
        Mock<IAgentEvaluationService> evaluationService = new();
        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuditEvent? capturedRetry = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => capturedRetry = e)
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("retry-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IUnifiedGoldenManifestReader> manifestReader = new(MockBehavior.Strict);

        ArchitectureRunExecuteOrchestrator sut = ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor.Object,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = evaluationService.Object,
                AgentResultRepository = resultRepo.Object,
                AgentEvaluationRepository = evalRepo.Object,
                AgentEvidencePackageRepository = evidenceRepo.Object,
                EvidenceBuilder = new DefaultEvidenceBuilder(manifestReader.Object),
                ActorContext = actorContext.Object,
                BaselineMutationAuditService = baselineAudit.Object,
                PostExecuteHooks = ArchitectureRunExecuteOrchestratorTestFactory.CreatePostExecuteHooks(
                auditService.Object,
                scopeProvider.Object,
                baselineAudit.Object,
                runRepo.Object),
                UnitOfWorkFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
                OutputTraceEvaluationHook = new NoOpAgentOutputTraceEvaluationHook(),
                AgentResultPostExecutionEnricher = new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
                EvidencePackageInjectionMitigator = new NoOpEvidencePackageInjectionMitigator(),
                AgentEvidenceUntrustedInputSanitizer = new NoOpAgentEvidenceUntrustedInputSanitizer(),
                RequestContentSafetyPrecheck = contentSafety.Object,
                AgentExecutionOptions = Microsoft.Extensions.Options.Options.Create(new AgentExecutionOptions()),
                EffectiveAgentExecutionModeAccessor = new FixedEffectiveAgentExecutionModeAccessor(),
                AgentOutputQualityGateOptions = Microsoft.Extensions.Options.Options.Create(new AgentOutputQualityGateOptions()),
                RunStateTransitionService = new RunStateTransitionService(),
                RunEngineProvenanceCaptureService = Mock.Of<IRunEngineProvenanceCaptureService>(),
                ExecuteTimeGovernanceScopeCaptureService = Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
                TopologyProposalSeeder = ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
                DemoExpensiveActionGate = ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
                RunScopedLlmBudgetReservationService = ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
                OperationCancellationRegistry = new OperationCancellationRegistry(),
                RunCancellationMarker = new OperationRunCancellationMarker(runRepo.Object),
                RunExecuteOwnershipLeaseService = new DisabledRunExecuteOwnershipLeaseService(),
                RunStageOutcomesRepository = Mock.Of<IRunStageOutcomesRepository>(),
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance
            });;

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*No tasks found*");

        capturedRetry.Should().NotBeNull();
        capturedRetry!.EventType.Should().Be(AuditEventTypes.Run.RetryRequested);
        capturedRetry.RunId.Should().Be(runGuid);
        capturedRetry.TenantId.Should().Be(TestScope.TenantId);
        capturedRetry.WorkspaceId.Should().Be(TestScope.WorkspaceId);
        capturedRetry.ProjectId.Should().Be(TestScope.ProjectId);
        capturedRetry.DataJson.Should().Contain(runId);
        capturedRetry.DataJson.Should().Contain(nameof(ArchitectureRunStatus.Failed));

        auditService.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.Run.RetryRequested), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ExecuteRunAsync_when_retry_requested_audit_fails_repeatedly_still_surfaces_execute_validation_error()
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
            ArchitectureRequestId = "req-retry-audit-sql",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-retry-audit-sql",
            Description = new string('x', 12),
            SystemName = "RetryAuditSql",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo.Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IAgentExecutor> executor = new();
        Mock<IAgentEvaluationService> evaluationService = new();
        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();

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
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit sql unavailable"));

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("retry-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IUnifiedGoldenManifestReader> manifestReaderAuditFail = new(MockBehavior.Strict);

        ArchitectureRunExecuteOrchestrator sut = ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor.Object,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = evaluationService.Object,
                AgentResultRepository = resultRepo.Object,
                AgentEvaluationRepository = evalRepo.Object,
                AgentEvidencePackageRepository = evidenceRepo.Object,
                EvidenceBuilder = new DefaultEvidenceBuilder(manifestReaderAuditFail.Object),
                ActorContext = actorContext.Object,
                BaselineMutationAuditService = baselineAudit.Object,
                PostExecuteHooks = ArchitectureRunExecuteOrchestratorTestFactory.CreatePostExecuteHooks(
                auditService.Object,
                scopeProvider.Object,
                baselineAudit.Object,
                runRepo.Object),
                UnitOfWorkFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
                OutputTraceEvaluationHook = new NoOpAgentOutputTraceEvaluationHook(),
                AgentResultPostExecutionEnricher = new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
                EvidencePackageInjectionMitigator = new NoOpEvidencePackageInjectionMitigator(),
                AgentEvidenceUntrustedInputSanitizer = new NoOpAgentEvidenceUntrustedInputSanitizer(),
                RequestContentSafetyPrecheck = contentSafety.Object,
                AgentExecutionOptions = Microsoft.Extensions.Options.Options.Create(new AgentExecutionOptions()),
                EffectiveAgentExecutionModeAccessor = new FixedEffectiveAgentExecutionModeAccessor(),
                AgentOutputQualityGateOptions = Microsoft.Extensions.Options.Options.Create(new AgentOutputQualityGateOptions()),
                RunStateTransitionService = new RunStateTransitionService(),
                RunEngineProvenanceCaptureService = Mock.Of<IRunEngineProvenanceCaptureService>(),
                ExecuteTimeGovernanceScopeCaptureService = Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
                TopologyProposalSeeder = ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
                DemoExpensiveActionGate = ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
                RunScopedLlmBudgetReservationService = ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
                OperationCancellationRegistry = new OperationCancellationRegistry(),
                RunCancellationMarker = new OperationRunCancellationMarker(runRepo.Object),
                RunExecuteOwnershipLeaseService = new DisabledRunExecuteOwnershipLeaseService(),
                RunStageOutcomesRepository = Mock.Of<IRunStageOutcomesRepository>(),
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance
            });;

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*No tasks found*");

        auditService.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.Run.RetryRequested), It.IsAny<CancellationToken>()),
            Times.Exactly(3));
    }

    [SkippableFact]
    public async Task ExecuteRunAsync_when_failed_deferred_run_resumes_authority_pipeline_instead_of_no_tasks()
    {
        Guid runGuid = Guid.Parse("851472cf-81fa-4314-9679-1ab899ae8324");
        string runId = runGuid.ToString("N");
        const string requestId = "req-deferred-execute";

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "ArchLucid",
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            LastFailureReason = """{"schemaVersion":1,"failureClass":"invalidOperation"}""",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            Description = new string('x', 12),
            SystemName = "ArchLucid",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(requestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo.Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IAgentExecutor> executor = new(MockBehavior.Strict);
        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);

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
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("retry-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IAuthorityRunOrchestrator> authority = new();
        authority
            .Setup(a => a.CompleteQueuedAuthorityPipelineAsync(
                It.IsAny<ContextIngestionRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                ProjectId = "ArchLucid",
                ContextSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            });

        IncompleteAuthorityPipelineExecuteHandler resumeHandler = new(
            authority.Object,
            requestRepo.Object,
            runRepo.Object,
            scopeProvider.Object,
            Mock.Of<IRunGovernanceScopePinService>(),
            new RunStateTransitionService(),
            new FailedRunRetryAdmission(runRepo.Object),
            NullLogger<IncompleteAuthorityPipelineExecuteHandler>.Instance);

        ArchitectureRunExecuteOrchestrator sut = ArchitectureRunExecuteOrchestratorTestFactory.Create(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor.Object,
            new ArchitectureRunExecuteOrchestratorCreateArgs
            {
                AgentEvaluationService = Mock.Of<IAgentEvaluationService>(),
                AgentResultRepository = resultRepo.Object,
                AgentEvaluationRepository = Mock.Of<IAgentEvaluationRepository>(),
                AgentEvidencePackageRepository = Mock.Of<IAgentEvidencePackageRepository>(),
                EvidenceBuilder = new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
                ActorContext = actorContext.Object,
                BaselineMutationAuditService = baselineAudit.Object,
                PostExecuteHooks = ArchitectureRunExecuteOrchestratorTestFactory.CreatePostExecuteHooks(
                    auditService.Object,
                    scopeProvider.Object,
                    baselineAudit.Object,
                    runRepo.Object),
                AgentResultPostExecutionEnricher = new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
                EvidencePackageInjectionMitigator = new NoOpEvidencePackageInjectionMitigator(),
                AgentEvidenceUntrustedInputSanitizer = new NoOpAgentEvidenceUntrustedInputSanitizer(),
                RequestContentSafetyPrecheck = contentSafety.Object,
                RunStateTransitionService = new RunStateTransitionService(),
                RunEngineProvenanceCaptureService = Mock.Of<IRunEngineProvenanceCaptureService>(),
                ExecuteTimeGovernanceScopeCaptureService = Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
                TopologyProposalSeeder = ArchitectureRunExecuteOrchestratorTestFactory.CreateDefaultTopologyProposalSeeder(),
                DemoExpensiveActionGate = ArchitectureRunExecuteOrchestratorTestFactory.CreatePermissiveDemoExpensiveActionGate(),
                RunScopedLlmBudgetReservationService = ArchitectureRunExecuteOrchestratorTestFactory.CreatePassThroughRunScopedLlmBudgetReservationService(),
                OperationCancellationRegistry = new OperationCancellationRegistry(),
                RunCancellationMarker = new OperationRunCancellationMarker(runRepo.Object),
                RunExecuteOwnershipLeaseService = new DisabledRunExecuteOwnershipLeaseService(),
                RunStageOutcomesRepository = Mock.Of<IRunStageOutcomesRepository>(),
                AgentExecutionReadinessGuard = new PermissiveAgentExecutionReadinessGuard(),
                Logger = NullLogger<ArchitectureRunExecuteOrchestrator>.Instance,
                IncompleteAuthorityPipelineExecuteHandler = resumeHandler,
            });

        ExecuteRunResult result = await sut.ExecuteRunAsync(runId);

        result.RunId.Should().Be(runId);
        result.Results.Should().BeEmpty();
        authority.Verify(
            a => a.CompleteQueuedAuthorityPipelineAsync(
                It.Is<ContextIngestionRequest>(r => r.RunId == runGuid),
                It.IsAny<CancellationToken>()),
            Times.Once);
        executor.Verify(
            e => e.ExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
