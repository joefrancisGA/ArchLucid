using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Application.Runs.Orchestration.Execute.Hooks;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;
using ArchLucid.TestSupport.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

public static class ArchitectureRunExecuteOrchestratorTestFactory
{
    internal static ArchitectureRunExecuteOrchestrator Create(
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IArchitectureRequestRepository requestRepository,
        IAgentTaskRepository taskRepository,
        IAgentExecutor agentExecutor,
        ArchitectureRunExecuteOrchestratorCreateArgs? optional = null)
    {
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(requestRepository);
        ArgumentNullException.ThrowIfNull(taskRepository);
        ArgumentNullException.ThrowIfNull(agentExecutor);

        ArchitectureRunExecuteOrchestratorCreateArgs args = optional ?? new ArchitectureRunExecuteOrchestratorCreateArgs();

        IAgentResultRepository resultRepository =
            args.AgentResultRepository ?? Mock.Of<IAgentResultRepository>();

        IOptions<AgentExecutionOptions> agentExecutionOptions =
            args.AgentExecutionOptions ?? Options.Create(new AgentExecutionOptions());

        IEffectiveAgentExecutionModeAccessor effectiveModeAccessor =
            args.EffectiveAgentExecutionModeAccessor ?? new FixedEffectiveAgentExecutionModeAccessor();

        IRunStateTransitionService runStateTransitionService =
            args.RunStateTransitionService ?? new RunStateTransitionService();

        ArchitectureRunExecutePostExecuteHooks postExecuteHooks =
            args.PostExecuteHooks
            ?? CreatePostExecuteHooks();

        IArchLucidUnitOfWorkFactory unitOfWorkFactory =
            args.UnitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();

        IArchitectureRunExecutePersistRowsStage persistRowsStage = new ArchitectureRunExecutePersistRowsStage(
            scopeContextProvider,
            args.AgentEvidencePackageRepository ?? Mock.Of<IAgentEvidencePackageRepository>(),
            resultRepository,
            args.AgentEvaluationRepository ?? Mock.Of<IAgentEvaluationRepository>(),
            runRepository,
            effectiveModeAccessor);

        IArchitectureRunExecutePersistenceStage persistenceStage = new ArchitectureRunExecutePersistenceStage(
            unitOfWorkFactory,
            persistRowsStage);

        IArchitectureRunExecuteQualityGateRetryStage qualityGateRetryStage = new ArchitectureRunExecuteQualityGateRetryStage(
            args.AgentOutputQualityGateOptions ?? Options.Create(new AgentOutputQualityGateOptions()),
            agentExecutor,
            args.AgentResultPostExecutionEnricher ?? new NoOpAgentResultPostExecutionEnricher(),
            resultRepository,
            scopeContextProvider,
            persistRowsStage);

        IArchitectureRunExecuteQualityGateStage qualityGateStage = new ArchitectureRunExecuteQualityGateStage(
            args.AgentOutputQualityGateOptions ?? Options.Create(new AgentOutputQualityGateOptions()),
            args.OutputTraceEvaluationHook ?? Mock.Of<IAgentOutputTraceEvaluationHook>(),
            postExecuteHooks,
            qualityGateRetryStage,
            NullLogger<ArchitectureRunExecuteQualityGateStage>.Instance);

        IArchitectureRunExecuteFailureRecorder failureRecorder = new ArchitectureRunExecuteFailureRecorder(
            runRepository,
            scopeContextProvider,
            runStateTransitionService,
            NullLogger<ArchitectureRunExecuteFailureRecorder>.Instance);

        IArchitectureRunExecuteIdempotencyStage idempotencyStage = new ArchitectureRunExecuteIdempotencyStage(
            scopeContextProvider,
            runRepository,
            taskRepository,
            resultRepository,
            runStateTransitionService,
            args.OperationCancellationRegistry ?? new OperationCancellationRegistry(),
            effectiveModeAccessor,
            args.ActorContext ?? Mock.Of<IActorContext>(),
            postExecuteHooks,
            NullLogger<ArchitectureRunExecuteIdempotencyStage>.Instance);

        IArchitectureRunExecuteCancellationGuardStage cancellationGuardStage =
            new ArchitectureRunExecuteCancellationGuardStage(
                scopeContextProvider,
                runRepository,
                args.OperationCancellationRegistry ?? new OperationCancellationRegistry(),
                args.RunCancellationMarker ?? new OperationRunCancellationMarker(runRepository));

        IArchitectureRunExecutePreExecuteStage preExecuteStage = new ArchitectureRunExecutePreExecuteStage(
            scopeContextProvider,
            runRepository,
            idempotencyStage,
            cancellationGuardStage);

        IAgentLoopPrepareStage prepareStage = new AgentLoopPrepareStage(
            requestRepository,
            args.RequestContentSafetyPrecheck ?? Mock.Of<IRequestContentSafetyPrecheck>(),
            scopeContextProvider,
            runRepository,
            args.RunGovernanceScopePinService ?? Mock.Of<IRunGovernanceScopePinService>(),
            taskRepository,
            args.EvidenceBuilder ?? new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            args.EvidencePackageInjectionMitigator ?? new NoOpEvidencePackageInjectionMitigator(),
            args.AgentEvidenceUntrustedInputSanitizer ?? new NoOpAgentEvidenceUntrustedInputSanitizer(),
            NullLogger<AgentLoopPrepareStage>.Instance);

        IAgentLoopInvokeStage invokeStage = new AgentLoopInvokeStage(
            scopeContextProvider,
            agentExecutor,
            args.AgentEvaluationService ?? Mock.Of<IAgentEvaluationService>(),
            preExecuteStage,
            persistenceStage,
            failureRecorder,
            args.RunScopedLlmBudgetReservationService ?? CreatePassThroughRunScopedLlmBudgetReservationService(),
            args.AgentOutputQualityGateOptions ?? Options.Create(new AgentOutputQualityGateOptions()),
            args.BaselineMutationAuditService ?? Mock.Of<IBaselineMutationAuditService>(),
            NullLogger<AgentLoopInvokeStage>.Instance);

        IAgentLoopPersistStage persistStage = new AgentLoopPersistStage(
            args.AgentResultPostExecutionEnricher ?? new NoOpAgentResultPostExecutionEnricher(),
            args.AgentEvaluationService ?? Mock.Of<IAgentEvaluationService>(),
            persistenceStage,
            qualityGateStage,
            args.RunEngineProvenanceCaptureService ?? Mock.Of<IRunEngineProvenanceCaptureService>(),
            args.ExecuteTimeGovernanceScopeCaptureService ?? Mock.Of<IExecuteTimeGovernanceScopeCaptureService>(),
            preExecuteStage,
            args.TopologyProposalSeeder ?? CreateDefaultTopologyProposalSeeder(scopeContextProvider),
            args.BaselineMutationAuditService ?? Mock.Of<IBaselineMutationAuditService>(),
            NullLogger<AgentLoopPersistStage>.Instance);

        IArchitectureRunExecuteAgentLoopStage agentLoopStage = new ArchitectureRunExecuteAgentLoopStage(
            prepareStage,
            invokeStage,
            persistStage);

        IArchitectureRunExecuteScopeResolveStage scopeResolveStage = new ArchitectureRunExecuteScopeResolveStage(
            scopeContextProvider,
            resultRepository,
            runStateTransitionService,
            args.RunStageOutcomesRepository ?? Mock.Of<IRunStageOutcomesRepository>());

        IArchitectureRunExecuteTelemetryStage telemetryStage = new ArchitectureRunExecuteTelemetryStage(
            agentExecutionOptions,
            effectiveModeAccessor,
            NullLogger<ArchitectureRunExecuteTelemetryStage>.Instance);

        IArchitectureRunExecuteTailHooksStage tailHooksStage = new ArchitectureRunExecuteTailHooksStage(
            scopeContextProvider,
            args.BaselineMutationAuditService ?? Mock.Of<IBaselineMutationAuditService>(),
            postExecuteHooks,
            args.DemoExpensiveActionGate ?? CreatePermissiveDemoExpensiveActionGate(),
            args.AgentExecutionReadinessGuard ?? new PermissiveAgentExecutionReadinessGuard());

        return new ArchitectureRunExecuteOrchestrator(
            runRepository,
            scopeContextProvider,
            requestRepository,
            taskRepository,
            resultRepository,
            args.ActorContext ?? Mock.Of<IActorContext>(),
            args.BaselineMutationAuditService ?? Mock.Of<IBaselineMutationAuditService>(),
            postExecuteHooks,
            agentExecutionOptions,
            args.RunExecuteOwnershipLeaseService ?? new DisabledRunExecuteOwnershipLeaseService(),
            preExecuteStage,
            agentLoopStage,
            scopeResolveStage,
            telemetryStage,
            tailHooksStage,
            args.IncompleteAuthorityPipelineExecuteHandler ?? CreateNoOpIncompleteAuthorityPipelineExecuteHandler());
    }

    internal static ArchitectureRunExecuteOrchestratorTailDependencies CreateStandardTailDependencies(
        IScopeContextProvider? scopeContextProvider = null,
        IRunRepository? runRepository = null)
    {
        IRunRepository runs = runRepository ?? Mock.Of<IRunRepository>();

        return new(
            CreateDefaultTopologyProposalSeeder(scopeContextProvider),
            CreatePermissiveDemoExpensiveActionGate(),
            CreatePassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runs),
            new DisabledRunExecuteOwnershipLeaseService(),
            Mock.Of<IRunStageOutcomesRepository>(),
            CreatePostExecuteHooks(runRepository: runs, scopeContextProvider: scopeContextProvider),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }

    internal static IIncompleteAuthorityPipelineExecuteHandler CreateNoOpIncompleteAuthorityPipelineExecuteHandler()
    {
        Mock<IIncompleteAuthorityPipelineExecuteHandler> handler = new();
        handler
            .Setup(h => h.TryResumeAsync(
                It.IsAny<ArchitectureRun>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExecuteRunResult?)null);

        return handler.Object;
    }

    internal static ArchitectureRunExecutePostExecuteHooks CreatePostExecuteHooks(
        IAuditService? auditService = null,
        IScopeContextProvider? scopeContextProvider = null,
        IBaselineMutationAuditService? baselineMutationAudit = null,
        IRunRepository? runRepository = null,
        IRunStateTransitionService? runStateTransitionService = null,
        IIntegrationEventOutboxRepository? integrationEventOutbox = null,
        IIntegrationEventPublisher? integrationEventPublisher = null,
        IOptionsMonitor<IntegrationEventsOptions>? integrationEventsOptions = null,
        ILogger<ArchitectureRunExecutePostExecuteHooks>? logger = null,
        IArchitectureRunExecuteAuditHook? auditHook = null,
        IArchitectureRunExecuteBaselineMutationHook? baselineMutationHook = null,
        IArchitectureRunExecuteOutboxPublishHook? outboxPublishHook = null)
    {
        if (auditService is not null
            || scopeContextProvider is not null
            || baselineMutationAudit is not null
            || runRepository is not null
            || runStateTransitionService is not null
            || integrationEventOutbox is not null
            || integrationEventPublisher is not null
            || integrationEventsOptions is not null
            || logger is not null)
        {
            IScopeContextProvider scope = scopeContextProvider ?? Mock.Of<IScopeContextProvider>();
            IRunRepository runs = runRepository ?? Mock.Of<IRunRepository>();
            IRunStateTransitionService transitions = runStateTransitionService ?? new RunStateTransitionService();

            return new ArchitectureRunExecutePostExecuteHooks(
                new ArchitectureRunExecuteAuditHook(
                    auditService ?? Mock.Of<IAuditService>(),
                    scope,
                    NullLogger<ArchitectureRunExecuteAuditHook>.Instance),
                new ArchitectureRunExecuteBaselineMutationHook(
                    baselineMutationAudit ?? Mock.Of<IBaselineMutationAuditService>(),
                    runs,
                    transitions,
                    scope,
                    NullLogger<ArchitectureRunExecuteBaselineMutationHook>.Instance),
                new ArchitectureRunExecuteOutboxPublishHook(
                    scope,
                    integrationEventOutbox ?? CreateIntegrationEventOutbox(),
                    integrationEventPublisher ?? CreateIntegrationEventPublisher(),
                    integrationEventsOptions ?? CreateIntegrationEventsOptionsMonitor(),
                    Mock.Of<IAuthorityQueryService>(),
                    Mock.Of<IManifestHashService>(),
                    NullLogger<ArchitectureRunExecuteOutboxPublishHook>.Instance));
        }

        return new ArchitectureRunExecutePostExecuteHooks(
            auditHook ?? Mock.Of<IArchitectureRunExecuteAuditHook>(),
            baselineMutationHook ?? Mock.Of<IArchitectureRunExecuteBaselineMutationHook>(),
            outboxPublishHook ?? Mock.Of<IArchitectureRunExecuteOutboxPublishHook>());
    }

    internal static TechnologyLedgerTopologyProposalSeeder CreateDefaultTopologyProposalSeeder(
        IScopeContextProvider? scopeContextProvider = null) =>
        new(
            new InMemoryTechnologyLedgerRepository(),
            scopeContextProvider ?? Mock.Of<IScopeContextProvider>(),
            TimeProvider.System);

    internal static DemoExpensiveActionGate CreatePermissiveDemoExpensiveActionGate()
    {
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(p => p.ResolveWorkspaceKindAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(AiUsageWorkspaceKind.Paid);

        Mock<IOptionsMonitor<AiUsageControlsOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(new AiUsageControlsOptions { DemoMode = false });

        return new DemoExpensiveActionGate(
            policyResolver.Object,
            optionsMonitor.Object);
    }

    internal static IRunScopedLlmBudgetReservationService CreatePassThroughRunScopedLlmBudgetReservationService() =>
        new PassThroughRunScopedLlmBudgetReservationService();

    internal static IOperationCancellationRegistry CreateDefaultCancellationRegistry() =>
        new OperationCancellationRegistry();

    internal static OperationRunCancellationMarker CreateRunCancellationMarker(IRunRepository runRepository) =>
        new(runRepository);

    internal static IIntegrationEventOutboxRepository CreateIntegrationEventOutbox() =>
        Mock.Of<IIntegrationEventOutboxRepository>();

    internal static IIntegrationEventPublisher CreateIntegrationEventPublisher() =>
        Mock.Of<IIntegrationEventPublisher>();

    internal static IOptionsMonitor<IntegrationEventsOptions> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return options.Object;
    }
}
