using System.Diagnostics;

using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Operations;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref = "IArchitectureRunExecuteOrchestrator"/>
public sealed partial class ArchitectureRunExecuteOrchestrator(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IArchitectureRequestRepository requestRepository,
    IAgentTaskRepository taskRepository,
    IAgentExecutor agentExecutor,
    IAgentEvaluationService agentEvaluationService,
    IAgentResultRepository resultRepository,
    IAgentEvaluationRepository agentEvaluationRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IEvidenceBuilder evidenceBuilder,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    IAuditService auditService,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IAgentOutputTraceEvaluationHook outputTraceEvaluationHook,
    IAgentResultPostExecutionEnricher agentResultPostExecutionEnricher,
    IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
    IAgentEvidenceUntrustedInputSanitizer agentEvidenceUntrustedInputSanitizer,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IOptions<AgentExecutionOptions> agentExecutionOptions,
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IRunStateTransitionService runStateTransitionService,
    IRunEngineProvenanceCaptureService runEngineProvenanceCaptureService,
    TechnologyLedgerTopologyProposalSeeder technologyLedgerTopologyProposalSeeder,
    DemoExpensiveActionGate demoExpensiveActionGate,
    IRunScopedLlmBudgetReservationService runScopedLlmBudgetReservationService,
    IOperationCancellationRegistry operationCancellationRegistry,
    OperationRunCancellationMarker runCancellationMarker,
    IRunExecuteOwnershipLeaseService runExecuteOwnershipLeaseService,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<ArchitectureRunExecuteOrchestrator> logger) : IArchitectureRunExecuteOrchestrator
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly IOptions<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IAgentOutputTraceEvaluationHook _outputTraceEvaluationHook =
        outputTraceEvaluationHook ?? throw new ArgumentNullException(nameof(outputTraceEvaluationHook));

    private readonly IAgentResultPostExecutionEnricher _agentResultPostExecutionEnricher =
        agentResultPostExecutionEnricher ?? throw new ArgumentNullException(nameof(agentResultPostExecutionEnricher));

    private readonly IEvidencePackageInjectionMitigator _evidencePackageInjectionMitigator =
        evidencePackageInjectionMitigator ?? throw new ArgumentNullException(nameof(evidencePackageInjectionMitigator));

    private readonly IAgentEvidenceUntrustedInputSanitizer _agentEvidenceUntrustedInputSanitizer =
        agentEvidenceUntrustedInputSanitizer ?? throw new ArgumentNullException(nameof(agentEvidenceUntrustedInputSanitizer));

    private readonly ILogger<ArchitectureRunExecuteOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentEvaluationService
        _agentEvaluationService = agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IAgentEvaluationRepository _agentEvaluationRepository =
        agentEvaluationRepository ?? throw new ArgumentNullException(nameof(agentEvaluationRepository));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IEvidenceBuilder _evidenceBuilder = evidenceBuilder ?? throw new ArgumentNullException(nameof(evidenceBuilder));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IAgentExecutor _agentExecutor = agentExecutor ?? throw new ArgumentNullException(nameof(agentExecutor));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IRunEngineProvenanceCaptureService _runEngineProvenanceCaptureService =
        runEngineProvenanceCaptureService ?? throw new ArgumentNullException(nameof(runEngineProvenanceCaptureService));

    private readonly TechnologyLedgerTopologyProposalSeeder _technologyLedgerTopologyProposalSeeder =
        technologyLedgerTopologyProposalSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerTopologyProposalSeeder));

    private readonly DemoExpensiveActionGate _demoExpensiveActionGate =
        demoExpensiveActionGate ?? throw new ArgumentNullException(nameof(demoExpensiveActionGate));

    private readonly IRunScopedLlmBudgetReservationService _runScopedLlmBudgetReservationService =
        runScopedLlmBudgetReservationService ?? throw new ArgumentNullException(nameof(runScopedLlmBudgetReservationService));

    private readonly IOperationCancellationRegistry _operationCancellationRegistry =
        operationCancellationRegistry ?? throw new ArgumentNullException(nameof(operationCancellationRegistry));

    private readonly OperationRunCancellationMarker _runCancellationMarker =
        runCancellationMarker ?? throw new ArgumentNullException(nameof(runCancellationMarker));

    private readonly IRunExecuteOwnershipLeaseService _runExecuteOwnershipLeaseService =
        runExecuteOwnershipLeaseService ?? throw new ArgumentNullException(nameof(runExecuteOwnershipLeaseService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    /// <inheritdoc/>
    public async Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ValidateDependencies(runRepository, scopeContextProvider, requestRepository, taskRepository, agentExecutor, agentEvaluationService, resultRepository,
            agentEvaluationRepository, agentEvidencePackageRepository, evidenceBuilder, actorContext, baselineMutationAudit, auditService, unitOfWorkFactory,
            outputTraceEvaluationHook, agentResultPostExecutionEnricher, evidencePackageInjectionMitigator,
            agentEvidenceUntrustedInputSanitizer, requestContentSafetyPrecheck,
            agentExecutionOptions, agentOutputQualityGateOptions, logger);
        string actor = actorContext.GetActor();
        try
        {
            if (TryParseRunGuid(runId, out Guid runGuid) && _runExecuteOwnershipLeaseService.IsEnabled)
            {
                await _runExecuteOwnershipLeaseService.AcquireAsync(runGuid, cancellationToken).ConfigureAwait(false);

                try
                {
                    return await ExecuteRunCoreAsync(runId, actor, cancellationToken).ConfigureAwait(false);
                }
                finally
                {
                    await _runExecuteOwnershipLeaseService
                        .ReleaseAsync(runGuid, CancellationToken.None)
                        .ConfigureAwait(false);
                }
            }

            return await ExecuteRunCoreAsync(runId, actor, cancellationToken).ConfigureAwait(false);
        }
        catch (RunNotFoundException)
        {
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, "Run not found.", cancellationToken);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<ExecuteRunResult> ExecuteSelectiveRunAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ValidateDependencies(runRepository, scopeContextProvider, requestRepository, taskRepository, agentExecutor, agentEvaluationService, resultRepository,
            agentEvaluationRepository, agentEvidencePackageRepository, evidenceBuilder, actorContext, baselineMutationAudit, auditService, unitOfWorkFactory,
            outputTraceEvaluationHook, agentResultPostExecutionEnricher, evidencePackageInjectionMitigator,
            agentEvidenceUntrustedInputSanitizer, requestContentSafetyPrecheck,
            agentExecutionOptions, agentOutputQualityGateOptions, logger);

        string actor = actorContext.GetActor();
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
                runRepository,
                scopeContextProvider,
                taskRepository,
                runId,
                cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);

        await ThrowIfAuthorityPipelineCompleteAsync(run, runId, cancellationToken);

        if (run.Status is ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Run '{runId}' is already committed and cannot be selectively re-executed.");
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> scheduledTasks = await taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (scheduledTasks.Count == 0)
            throw new InvalidOperationException($"No tasks found for run '{runId}'.");

        IReadOnlyList<AgentTask> forcedTasks = SelectiveAgentExecutePlanner.ResolveTasksToForce(scheduledTasks, request);

        foreach (AgentTask task in forcedTasks)
        {
            await _resultRepository.DeleteForRunTaskAsync(runId, task.TaskId, cancellationToken);
        }

        await TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(runId, run.Status, cancellationToken);
        await TryLogSelectiveExecuteRequestedAsync(runId, actor, forcedTasks, request.IncludeDependents, cancellationToken);

        return await ExecuteRunAsync(runId, cancellationToken);
    }

    private static void ValidateDependencies(IRunRepository runRepository, IScopeContextProvider scopeContextProvider,
        IArchitectureRequestRepository requestRepository, IAgentTaskRepository taskRepository, IAgentExecutor agentExecutor,
        IAgentEvaluationService agentEvaluationService, IAgentResultRepository resultRepository, IAgentEvaluationRepository agentEvaluationRepository,
        IAgentEvidencePackageRepository agentEvidencePackageRepository, IEvidenceBuilder evidenceBuilder, IActorContext actorContext,
        IBaselineMutationAuditService baselineMutationAudit, IAuditService auditService, IArchLucidUnitOfWorkFactory unitOfWorkFactory,
        IAgentOutputTraceEvaluationHook outputTraceEvaluationHook, IAgentResultPostExecutionEnricher agentResultPostExecutionEnricher,
        IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
        IAgentEvidenceUntrustedInputSanitizer agentEvidenceUntrustedInputSanitizer,
        IRequestContentSafetyPrecheck requestContentSafetyPrecheck, IOptions<AgentExecutionOptions> agentExecutionOptions,
        IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
        ILogger<ArchitectureRunExecuteOrchestrator> logger)
    {
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(requestRepository);
        ArgumentNullException.ThrowIfNull(taskRepository);
        ArgumentNullException.ThrowIfNull(agentExecutor);
        ArgumentNullException.ThrowIfNull(agentEvaluationService);
        ArgumentNullException.ThrowIfNull(resultRepository);
        ArgumentNullException.ThrowIfNull(agentEvaluationRepository);
        ArgumentNullException.ThrowIfNull(agentEvidencePackageRepository);
        ArgumentNullException.ThrowIfNull(evidenceBuilder);
        ArgumentNullException.ThrowIfNull(actorContext);
        ArgumentNullException.ThrowIfNull(baselineMutationAudit);
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(unitOfWorkFactory);
        ArgumentNullException.ThrowIfNull(outputTraceEvaluationHook);
        ArgumentNullException.ThrowIfNull(agentResultPostExecutionEnricher);
        ArgumentNullException.ThrowIfNull(evidencePackageInjectionMitigator);
        ArgumentNullException.ThrowIfNull(agentEvidenceUntrustedInputSanitizer);
        ArgumentNullException.ThrowIfNull(requestContentSafetyPrecheck);
        ArgumentNullException.ThrowIfNull(agentExecutionOptions);
        ArgumentNullException.ThrowIfNull(agentOutputQualityGateOptions);
        ArgumentNullException.ThrowIfNull(logger);
    }

    private async Task<ExecuteRunResult> ExecuteRunCoreAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        string executionModeLabel =
            AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel(_agentExecutionOptions.Value.Mode);

        using Activity? runActivity = ArchLucidInstrumentation.AgentExecution.StartActivity("architecture.run.execute");
        runActivity?.SetTag("archlucid.run_id", runId);
        runActivity?.SetTag("archlucid.execution_mode", executionModeLabel);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Executing architecture run: RunId={RunId}", LogSanitizer.Sanitize(runId));

        try
        {
            return await ExecuteRunCoreInnerAsync(runId, actor, cancellationToken);
        }
        catch (OperationCooperativeCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            runActivity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            runActivity?.AddException(ex);

            if (ex is not RunCostBudgetExceededPartialPersistRecordedException
                and not AgentOutputQualityGateRejectedException)
            {
                await RecordExecuteRunFailureAsync(runId, actor, ex, cancellationToken);
            }

            throw;
        }
    }

    private async Task<ExecuteRunResult> ExecuteRunCoreInnerAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(runRepository, scopeContextProvider, taskRepository, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);

        await ThrowIfAuthorityPipelineCompleteAsync(run, runId, cancellationToken);

        await TryLogFailedRunRetryRequestedAsync(run, runId, actor, cancellationToken);

        ExecuteRunResult? idempotent = await TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);

        if (idempotent is not null)
            return idempotent;

        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;

        await _demoExpensiveActionGate
            .EnsureExpensiveActionAllowedAsync(tenantId, AiUsageFeature.ArchitectureGeneration, cancellationToken)
            .ConfigureAwait(false);

        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunStarted, actor, runId, null, cancellationToken);

        return await ExecuteRunAgentBatchAsync(run, runId, actor, cancellationToken);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    /// <summary>
    ///     TB-1007 / EK-07: refuse execute when the authority pipeline is complete, not only
    ///     origin or golden-manifest heuristics.
    /// </summary>
    private async Task ThrowIfAuthorityPipelineCompleteAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        IReadOnlyList<StageTimelineSummary> stages =
            await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken);

        if (!RunKernelCompleteness.IsAuthorityPipelineComplete(run.GoldenManifestId, manifest: null, stages))
            return;

        if (run.Status is ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Run '{runId}' is authority-pipeline complete and cannot be executed via the agent-task loop.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> results =
            await _resultRepository.GetByRunIdAsync(scope, runId, cancellationToken, null, null);

        if (RunKernelCompleteness.IsAgentTaskLoopComplete(_runStateTransitionService, run.Status, results))
        {
            throw new ConflictException(
                $"Run '{runId}' is authority-pipeline complete and cannot be executed via the agent-task loop.");
        }
    }
}
