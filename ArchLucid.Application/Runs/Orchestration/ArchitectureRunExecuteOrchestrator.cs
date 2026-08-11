using System.Text.Json;

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
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref = "IArchitectureRunExecuteOrchestrator"/>
public sealed class ArchitectureRunExecuteOrchestrator(
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

    private async Task TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(
        string runId,
        ArchitectureRunStatus currentStatus,
        CancellationToken cancellationToken)
    {
        if (currentStatus is not ArchitectureRunStatus.ReadyForCommit)
            return;

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException(
                $"Run '{runId}' is already committed and cannot be selectively re-executed.");
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults);
        await runRepository.UpdateAsync(header, cancellationToken);
    }

    private async Task TryLogSelectiveExecuteRequestedAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        bool includeDependents,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        AuditEvent selectiveRequested = scope.CreateAuditEvent(
            AuditEventTypes.Run.SelectiveExecuteRequested,
            actor,
            actor,
            JsonSerializer.Serialize(new
            {
                runId,
                includeDependents,
                taskIds = forcedTasks.Select(static t => t.TaskId).ToArray(),
                agentTypes = forcedTasks.Select(static t => t.AgentType.ToString()).ToArray(),
            },
                AuditJsonSerializationOptions.Instance));
        selectiveRequested.RunId = runGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => auditService.LogAsync(selectiveRequested, ct),
            logger,
            $"{AuditEventTypes.Run.SelectiveExecuteRequested}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.Run.SelectiveExecuteRequested);
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

    private async Task TryLogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        if (run.Status is not ArchitectureRunStatus.Failed and not ArchitectureRunStatus.ExecutionCompletedQualityRejected)
            return;

        ScopeContext retryScope = scopeContextProvider.GetCurrentScope();

        if (!TryParseRunGuid(runId, out Guid failedRunGuid))
            return;

        AuditEvent retryRequested = retryScope.CreateAuditEvent(
            AuditEventTypes.Run.RetryRequested,
            actor,
            actor,
            JsonSerializer.Serialize(new
            {
                runId,
                previousStatus = run.Status.ToString()
            },
                AuditJsonSerializationOptions.Instance));
        retryRequested.RunId = failedRunGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => auditService.LogAsync(retryRequested, ct),
            logger,
            $"{AuditEventTypes.Run.RetryRequested}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.Run.RetryRequested);
    }

    private async Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken)
    {
        if (logger.IsEnabled(LogLevel.Warning))
            logger.LogWarningArchitectureRunExecutionFailed(ex, runId, ex.GetType().Name);

        logger.LogError(ex, "Architecture run execution failed: RunId={RunId}, ExceptionType={ExceptionType}. CorrelationId={CorrelationId}", LogSanitizer.Sanitize(runId), ex.GetType().Name, System.Diagnostics.Activity.Current?.Id ?? "unknown");

        AgentExecutionFailureSummary failureSummary = AgentExecutionFailureSummaryFactory.FromException(ex);
        await TryMarkRunExecuteFailedAsync(runId, failureSummary, cancellationToken);
        await baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            FormatExecuteRunFailureAuditDetails(failureSummary),
            cancellationToken);
    }

    private async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest request = await requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        RequestContentSafetyResult safety = await requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);

        if (!safety.IsAllowed)
            throw new RequestContentSafetyRejectedException(safety.Reasons);

        using (PilotModeGovernanceScope.BeginFromPolicyReferences(request.PolicyReferences))
        {
            ScopeContext executeScope = _scopeContextProvider.GetCurrentScope();
            IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(executeScope, runId, cancellationToken);

            if (tasks.Count == 0)
                throw new InvalidOperationException($"No tasks found for run '{runId}'.");
            AgentEvidencePackage evidence = await evidenceBuilder.BuildAsync(runId, request, cancellationToken);

            await _evidencePackageInjectionMitigator.RedactKnownInjectionPatternsAsync(evidence, cancellationToken);

            await _agentEvidenceUntrustedInputSanitizer.SanitizeAsync(evidence, cancellationToken);

            string scheduledTaskIds = AgentExecutionStateTransitionTaskIds.Format(tasks.ToList());

            if (TryParseRunGuid(runId, out Guid executeTransitionRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    executeTransitionRunId,
                    "execute_enter",
                    "agent_batch_executing",
                    scheduledTaskIds);

            Guid tenantId = executeScope.TenantId;
            RunScopedLlmBudgetAdmitResult budgetAdmit =
                await AdmitRunScopedLlmBudgetOrThrowAsync(tenantId, runId, tasks.Count, cancellationToken);

            IReadOnlyList<AgentResult> results;

            try
            {
                await ThrowIfCooperativeCancelRequestedAsync(runId, cancellationToken);

                try
                {
                    using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
                    {
                        results = await agentExecutor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
                    }
                }
                catch (AgentRunPartialBudgetException partial)
                    when (_agentOutputQualityGateOptions.Value.PersistPartialOutputsOnBudgetExceeded &&
                          partial.CompletedResults.Count > 0)
                {
                    IReadOnlyList<AgentEvaluation> partialEvaluations =
                        await agentEvaluationService.EvaluateAsync(
                            runId,
                            request,
                            evidence,
                            tasks,
                            partial.CompletedResults,
                            cancellationToken);

                    await PersistPartialExecutePhaseAsync(evidence, partial.CompletedResults, partialEvaluations, cancellationToken);

                    AgentExecutionFailureSummary partialFailure =
                        AgentExecutionFailureSummaryFactory.FromException(partial.BudgetCause);

                    await TryMarkRunExecuteFailedAsync(runId, partialFailure, partial.CompletedResults, cancellationToken);

                    await baselineMutationAudit.RecordAsync(
                        AuditEventTypes.Baseline.Architecture.RunFailed,
                        actor,
                        runId,
                        FormatExecuteRunFailureAuditDetails(partialFailure),
                        cancellationToken);

                    throw new RunCostBudgetExceededPartialPersistRecordedException(
                        partial.BudgetCause,
                        partial.CompletedResults.Count);
                }

                await FinalizeRunScopedLlmBudgetReservationAsync(
                    budgetAdmit,
                    commitReservation: true,
                    cancellationToken);
            }
            catch
            {
                await FinalizeRunScopedLlmBudgetReservationAsync(
                    budgetAdmit,
                    commitReservation: false,
                    cancellationToken);

                throw;
            }

            if (TryParseRunGuid(runId, out Guid afterBatchRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    afterBatchRunId,
                    "agent_batch_executing",
                    "agent_results_persisting",
                    scheduledTaskIds);

            await _agentResultPostExecutionEnricher
                .EnrichAsync(runId, request, evidence, results, cancellationToken)
                .ConfigureAwait(false);

            await TrySeedTechnologyLedgerFromTopologyAsync(runId, request, results, cancellationToken);

            IReadOnlyList<AgentEvaluation> evaluations =
                await agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
            await PersistExecutePhaseAsync(evidence, results, evaluations, cancellationToken);

            if (TryParseRunGuid(runId, out Guid afterPersistRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    afterPersistRunId,
                    "agent_results_persisting",
                    "execute_complete",
                    scheduledTaskIds);

            results = await RunQualityGateTraceEvaluationLoopAsync(
                runId,
                actor,
                request,
                evidence,
                tasks,
                results,
                cancellationToken);

            await TryPersistEngineProvenanceAsync(runId, evidence, cancellationToken);
            await TryApplyExecuteCompletionLegacyStatusAsync(runId, results, cancellationToken);
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded, actor, runId, $"ResultCount={results.Count}",
                cancellationToken);

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Architecture run execution completed: RunId={RunId}, ResultCount={ResultCount}", LogSanitizer.Sanitize(runId),
                    results.Count);

            return new ExecuteRunResult { RunId = runId, Results = results.ToList() };
        }
    }

    private async Task<IReadOnlyList<AgentResult>> RunQualityGateTraceEvaluationLoopAsync(
        string runId,
        string actor,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> initialResults,
        CancellationToken cancellationToken)
    {
        List<AgentResult> mutableResults = initialResults.ToList();
        IReadOnlyList<AgentResult> results = initialResults;
        int qualityGateAutoRetryAttempt = 0;
        int maxAutoRetries = Math.Max(0, _agentOutputQualityGateOptions.Value.MaxAutoRetries);

        while (true)
        {
            try
            {
                await outputTraceEvaluationHook.AfterSuccessfulExecuteAsync(runId, cancellationToken);
                results = mutableResults;
                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true }
                      && qualityGateAutoRetryAttempt < maxAutoRetries)
            {
                qualityGateAutoRetryAttempt++;

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation(
                        "Quality gate rejected trace; auto-retrying agent {AgentLabel} for RunId={RunId} attempt {Attempt}/{MaxAttempts} TraceId={TraceId}",
                        ex.AgentLabel,
                        LogSanitizer.Sanitize(runId),
                        qualityGateAutoRetryAttempt,
                        maxAutoRetries,
                        LogSanitizer.Sanitize(ex.TraceId));
                }

                mutableResults = await RetryQualityGateRejectedAgentAsync(
                    runId,
                    request,
                    evidence,
                    tasks,
                    mutableResults,
                    ex,
                    cancellationToken);
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true })
            {
                await TryMarkRunQualityGateRejectedAsync(runId, actor, ex, cancellationToken);
                throw;
            }
            catch (Exception ex)
            {
                if (logger.IsEnabled(LogLevel.Warning))
                    logger.LogWarning(ex, "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged.",
                        LogSanitizer.Sanitize(runId));

                logger.LogError(ex, "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged. CorrelationId={CorrelationId}", LogSanitizer.Sanitize(runId), System.Diagnostics.Activity.Current?.Id ?? "unknown");
                results = mutableResults;
                break;
            }
        }

        return results;
    }

    /// <summary>
    ///     Idempotency: <see cref = "ArchitectureRunStatus.ReadyForCommit"/> and <see cref = "ArchitectureRunStatus.Committed"/>
    ///     are terminal;
    ///     returns stored results or throws when the run record contradicts stored agent outputs.
    /// </summary>
    private async Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(ArchitectureRun run, string runId, CancellationToken cancellationToken)
    {
        ScopeContext idempotencyScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> existingResults = await resultRepository.GetByRunIdAsync(idempotencyScope, runId, cancellationToken);

        if (_runStateTransitionService.IsExecuteIdempotentTerminalStatus(run.Status))
        {
            if (existingResults.Count > 0)
            {
                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation(
                        "ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount}",
                        LogSanitizer.Sanitize(runId), run.Status, existingResults.Count);
                return new ExecuteRunResult { RunId = runId, Results = existingResults.ToList() };
            }

            throw new ConflictException($"Run '{runId}' is in status '{run.Status}' but has no stored agent results. " +
                                        "The run is in an inconsistent state and cannot be safely re-executed.");
        }

        // Authority LegacyRunStatus may still read TasksGenerated while execute results already exist; idempotency uses stored results.

        if (run.Status != ArchitectureRunStatus.TasksGenerated || existingResults.Count <= 0)
            return null;

        IReadOnlyList<AgentTask> scheduledTasks =
            await taskRepository.GetByRunIdAsync(idempotencyScope, runId, cancellationToken);

        if (!ArePersistedResultsCompleteForTasks(scheduledTasks, existingResults))
        {
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation(
                    "ExecuteRunAsync skipping idempotent early return: stored results are incomplete versus scheduled tasks for RunId={RunId}, StoredCount={StoredCount}, TaskCount={TaskCount}",
                    LogSanitizer.Sanitize(runId),
                    existingResults.Count,
                    scheduledTasks.Count);

            return null;
        }

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation(
                "ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount} (legacy status may lag)",
                LogSanitizer.Sanitize(runId), run.Status, existingResults.Count);
        await TryApplyExecuteCompletionLegacyStatusAsync(runId, existingResults, cancellationToken);
        return new ExecuteRunResult { RunId = runId, Results = existingResults.ToList() };
    }

    /// <summary>
    ///     ADR-0012: execute no longer wrote <c>LegacyRunStatus</c>; clients and UIs still expect
    ///     <see cref = "ArchitectureRunStatus.ReadyForCommit"/>
    ///     once all required agent outputs exist (matches commit prerequisites and orchestrator contract).
    /// </summary>
    private async Task TryPersistEngineProvenanceAsync(
        string runId,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken)
    {
        try
        {
            await _runEngineProvenanceCaptureService
                .TryCaptureAndPersistAsync(runId, evidence, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Engine provenance capture failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    /// <summary>
    ///     TB-937: after execute, promote to ReadyForCommit only when all required agents are commit-ready;
    ///     otherwise persist PartiallyCompleted so TasksGenerated cannot be finalized.
    /// </summary>
    private async Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Execute: cannot update run {RunId} status — dbo.Runs header missing.", LogSanitizer.Sanitize(runId));
            return;
        }

        string previousLegacyRunStatus = header.LegacyRunStatus ?? "";

        if (string.Equals(previousLegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        if (OperationRunCancellationMarker.IsAlreadyCanceled(header))
            return;

        if (_operationCancellationRegistry.IsCancelRequested(scope, OperationIdCodec.ForRun(runGuid)))
            return;

        ArchitectureRunStatus derived = _runStateTransitionService.DeriveStatusAfterExecuteCompletion(results);

        if (derived is ArchitectureRunStatus.ReadyForCommit
            && !_runStateTransitionService.ShouldPromoteLegacyStatusToReadyForCommit(previousLegacyRunStatus))
            return;

        header.LegacyRunStatus = derived.ToString();

        // TB-310: request-time authority pipeline may have sealed anchors; StructuralExecutionMode is immutable then.
        if (header.GoldenManifestId is null)
        {
            IReadOnlyList<AgentResult> persistedResults =
                await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

            StructuralExecutionMode? rollup =
                RunStructuralExecutionModeRollup.TryResolveFromStampedResults(persistedResults);

            if (rollup is not null)
            {
                header.StructuralExecutionMode = rollup.Value;
            }
            else if (derived is ArchitectureRunStatus.ReadyForCommit)
            {
                header.StructuralExecutionMode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
                    _agentExecutionOptions.Value,
                    header.RealModeFellBackToSimulator);
            }
        }

        await runRepository.UpdateAsync(header, cancellationToken);

        if (derived is not ArchitectureRunStatus.ReadyForCommit)
            return;

        string actor = actorContext.GetActor();
        AuditEvent legacyReadyForCommitPromoted = new()
        {
            EventType = AuditEventTypes.RunLegacyReadyForCommitPromoted,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            DataJson = JsonSerializer.Serialize(new
            {
                runId,
                previousLegacyRunStatus,
                newLegacyRunStatus = header.LegacyRunStatus
            },
                AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.TryLogAsync(
            ct => auditService.LogAsync(legacyReadyForCommitPromoted, ct),
            logger,
            $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
    }

    private async Task<List<AgentResult>> RetryQualityGateRejectedAgentAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> currentResults,
        AgentOutputQualityGateRejectedException rejection,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(rejection);

        if (!Enum.TryParse(rejection.AgentLabel, ignoreCase: true, out AgentType agentType))
        {
            throw new InvalidOperationException(
                $"Cannot auto-retry quality gate rejection: unknown agent label '{rejection.AgentLabel}'.");
        }

        AgentTask? task = tasks.FirstOrDefault(t => t.AgentType == agentType);

        if (task is null)
        {
            throw new InvalidOperationException(
                $"Cannot auto-retry quality gate rejection: no task for agent '{rejection.AgentLabel}' on run '{runId}'.");
        }

        AgentTask retryTask = BuildQualityGateRetryTask(task, agentType);

        IReadOnlyList<AgentResult> retryBatch;

        using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
        {
            retryBatch =
                await _agentExecutor.ExecuteAsync(runId, request, evidence, [retryTask], cancellationToken);
        }

        if (retryBatch.Count == 0)
        {
            throw new InvalidOperationException(
                $"Quality gate auto-retry produced no result for agent '{rejection.AgentLabel}' on run '{runId}'.");
        }

        AgentResult replacement = retryBatch[0];

        await _agentResultPostExecutionEnricher
            .EnrichAsync(runId, request, evidence, retryBatch, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await TryLoadRunHeaderForStampingAsync(runId, scope, cancellationToken);
        StampTaskExecutionModesOnResults([replacement], header);

        await _resultRepository.ReplaceForRunTaskAsync(replacement, cancellationToken);

        List<AgentResult> updated = currentResults.ToList();
        int index = updated.FindIndex(r => string.Equals(r.TaskId, task.TaskId, StringComparison.Ordinal));

        if (index >= 0)
            updated[index] = replacement;
        else
            updated.Add(replacement);

        return updated;
    }

    private AgentTask BuildQualityGateRetryTask(AgentTask task, AgentType agentType)
    {
        if (!_agentOutputQualityGateOptions.Value.EscalateTierOnRetry)
            return task;

        LlmModelTier currentTier = task.ModelTierOverride ?? AgentModelTierRetryDefaults.DefaultTierForAgent(agentType);

        if (!AgentModelTierEscalation.CanEscalate(currentTier))
            return task;

        LlmModelTier escalatedTier = AgentModelTierEscalation.Escalate(currentTier);

        return new AgentTask
        {
            TaskId = task.TaskId,
            RunId = task.RunId,
            AgentType = task.AgentType,
            AgentTypeKey = task.AgentTypeKey,
            Objective = task.Objective,
            Status = task.Status,
            CreatedUtc = task.CreatedUtc,
            CompletedUtc = task.CompletedUtc,
            EvidenceBundleRef = task.EvidenceBundleRef,
            AllowedTools = task.AllowedTools,
            AllowedSources = task.AllowedSources,
            ModelTierOverride = escalatedTier,
        };
    }

    private async Task TryMarkRunQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Quality gate reject: dbo.Runs header missing for RunId={RunId}.", LogSanitizer.Sanitize(runId));

            return;
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected);
        await runRepository.UpdateAsync(header, cancellationToken);

        string details = $"TraceId={ex.TraceId};AgentLabel={ex.AgentLabel}";
        await baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
            actor,
            runId,
            details,
            cancellationToken);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    private async Task ThrowIfCooperativeCancelRequestedAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string operationId = OperationIdCodec.ForRun(runGuid);

        if (!_operationCancellationRegistry.IsCancelRequested(scope, operationId))
            return;

        await _runCancellationMarker.TryMarkRunCanceledAsync(scope, runGuid, cancellationToken);

        throw new OperationCooperativeCanceledException(runId);
    }

    private Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken) =>
        TryMarkRunExecuteFailedAsync(runId, summary, completedResults: null, cancellationToken);

    private async Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        IReadOnlyList<AgentResult>? completedResults,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus failedStatus = _runStateTransitionService.DeriveStatusAfterExecuteFailure(completedResults);
        header.LegacyRunStatus = failedStatus.ToString();
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await runRepository.UpdateAsync(header, cancellationToken);

        logger.LogError(
            "Run execution failed for RunId={RunId}. Status={Status}. CorrelationId={CorrelationId}",
            LogSanitizer.Sanitize(runId),
            failedStatus,
            System.Diagnostics.Activity.Current?.Id ?? "unknown");
    }

    private async Task TrySeedTechnologyLedgerFromTopologyAsync(
        string runId,
        ArchitectureRequest request,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        AgentResult? topologyResult = results.FirstOrDefault(result => result.AgentType == AgentType.Topology);

        if (topologyResult is null)
            return;

        try
        {
            await _technologyLedgerTopologyProposalSeeder
                .SeedFromTopologyResultAsync(runId, request, topologyResult, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Technology Ledger topology proposal seeding failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    /// <summary>
    ///     Persists evidence, results, and evaluations inside one transaction so retries do not duplicate rows.
    /// </summary>
    private async Task PersistExecutePhaseAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results, IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            await PersistExecutePhaseRowsAsync(evidence, results, evaluations, uow, cancellationToken);
            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task PersistExecutePhaseRowsAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations, IArchLucidUnitOfWork uow, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (results.Count > 0)
        {
            RunRecord? header = await TryLoadRunHeaderForStampingAsync(results[0].RunId, scope, cancellationToken);

            StampTaskExecutionModesOnResults(results, header);
        }

        if (uow.SupportsExternalTransaction)
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken,
                uow.Connection,
                uow.Transaction);
        }
        else
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken);

            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }

    private static string FormatExecuteRunFailureAuditDetails(AgentExecutionFailureSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return AgentExecutionFailureSummaryJson.Serialize(summary);
    }

    internal static bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults)
    {
        ArgumentNullException.ThrowIfNull(tasks);
        ArgumentNullException.ThrowIfNull(existingResults);

        if (tasks.Count == 0)
            return false;

        Dictionary<string, AgentResult> latestByTaskId = existingResults
            .GroupBy(static result => result.TaskId, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.Last(), StringComparer.Ordinal);

        foreach (AgentTask task in tasks)
        {
            if (!latestByTaskId.TryGetValue(task.TaskId, out AgentResult? persisted)
                || !AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(persisted, out _))
            {
                return false;
            }
        }

        return true;
    }

    private async Task PersistPartialExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            await PersistPartialExecutePhaseRowsAsync(evidence, results, evaluations, uow, cancellationToken);

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);

            throw;
        }
    }

    private async Task PersistPartialExecutePhaseRowsAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(evaluations);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (uow.SupportsExternalTransaction)
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            if (evaluations.Count > 0)
            {
                await agentEvaluationRepository.CreateManyAsync(
                    DecisionRecordMapper.ToRecords(evaluations),
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            }

            return;
        }

        if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                agentEvidencePackageRepository, evidence, cancellationToken))
        {
            await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
        }

        await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
            resultRepository,
            scope,
            results,
            cancellationToken);

        if (evaluations.Count > 0)
        {
            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }

    private async Task<RunScopedLlmBudgetAdmitResult> AdmitRunScopedLlmBudgetOrThrowAsync(
        Guid tenantId,
        string runId,
        int agentTaskCount,
        CancellationToken cancellationToken)
    {
        RunScopedLlmBudgetAdmitResult admit = await _runScopedLlmBudgetReservationService
            .AdmitBeforeAgentBatchAsync(tenantId, runId, agentTaskCount, cancellationToken);

        if (admit.Allowed)
            return admit;

        return admit.RejectionReason switch
        {
            RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded =>
                throw new CostLimitExceededException(
                    $"Run '{runId}' estimated agent-batch cost exceeds MaxCostPerRun / MaxTokensPerRun before execution."),
            RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded =>
                throw new LlmTokenQuotaExceededException(
                    $"Run '{runId}' cannot start: tenant monthly LLM dollar budget lacks headroom for the estimated agent batch."),
            RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget reservation store is unavailable."),
            RunScopedLlmBudgetAdmitRejectionReason.Disabled =>
                admit,
            null =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget admission was rejected."),
            _ =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget admission was rejected ({admit.RejectionReason})."),
        };
    }

    private async Task FinalizeRunScopedLlmBudgetReservationAsync(
        RunScopedLlmBudgetAdmitResult admit,
        bool commitReservation,
        CancellationToken cancellationToken)
    {
        if (!admit.ReservationHeld || admit.ReservationId is null)
            return;

        Guid reservationId = admit.ReservationId.Value;

        if (commitReservation)
        {
            await _runScopedLlmBudgetReservationService.CommitAsync(
                reservationId,
                admit.ReservedUsd,
                cancellationToken);

            return;
        }

        await _runScopedLlmBudgetReservationService.ReleaseAsync(reservationId, cancellationToken);
    }

    private async Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        return await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);
    }

    private void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header)
    {
        bool isSimulatorHost = !_agentExecutionOptions.Value.Mode.Equals("Real", StringComparison.OrdinalIgnoreCase);
        bool realModeFellBackToSimulator = header?.RealModeFellBackToSimulator ?? false;

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            results,
            _agentExecutionOptions.Value,
            realModeFellBackToSimulator,
            isSimulatorHost);
    }
}
