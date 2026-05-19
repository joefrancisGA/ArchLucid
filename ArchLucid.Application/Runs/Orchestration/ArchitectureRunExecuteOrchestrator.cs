using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Decisions;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
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
    IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IOptions<AgentExecutionOptions> agentExecutionOptions,
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IRunStateTransitionService runStateTransitionService,
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

    private readonly IEvidencePackageInjectionMitigator _evidencePackageInjectionMitigator =
        evidencePackageInjectionMitigator ?? throw new ArgumentNullException(nameof(evidencePackageInjectionMitigator));

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

    /// <inheritdoc/>
    public async Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ValidateDependencies(runRepository, scopeContextProvider, requestRepository, taskRepository, agentExecutor, agentEvaluationService, resultRepository,
            agentEvaluationRepository, agentEvidencePackageRepository, evidenceBuilder, actorContext, baselineMutationAudit, auditService, unitOfWorkFactory,
            outputTraceEvaluationHook, evidencePackageInjectionMitigator, requestContentSafetyPrecheck, agentExecutionOptions, agentOutputQualityGateOptions, logger);
        string actor = actorContext.GetActor();
        try
        {
            return await ExecuteRunCoreAsync(runId, actor, cancellationToken);
        }
        catch (RunNotFoundException)
        {
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runId, "Run not found.", cancellationToken);
            throw;
        }
    }

    private static void ValidateDependencies(IRunRepository runRepository, IScopeContextProvider scopeContextProvider,
        IArchitectureRequestRepository requestRepository, IAgentTaskRepository taskRepository, IAgentExecutor agentExecutor,
        IAgentEvaluationService agentEvaluationService, IAgentResultRepository resultRepository, IAgentEvaluationRepository agentEvaluationRepository,
        IAgentEvidencePackageRepository agentEvidencePackageRepository, IEvidenceBuilder evidenceBuilder, IActorContext actorContext,
        IBaselineMutationAuditService baselineMutationAudit, IAuditService auditService, IArchLucidUnitOfWorkFactory unitOfWorkFactory,
        IAgentOutputTraceEvaluationHook outputTraceEvaluationHook, IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
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
        ArgumentNullException.ThrowIfNull(evidencePackageInjectionMitigator);
        ArgumentNullException.ThrowIfNull(requestContentSafetyPrecheck);
        ArgumentNullException.ThrowIfNull(agentExecutionOptions);
        ArgumentNullException.ThrowIfNull(agentOutputQualityGateOptions);
        ArgumentNullException.ThrowIfNull(logger);
    }

    private async Task<ExecuteRunResult> ExecuteRunCoreAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Executing architecture run: RunId={RunId}", LogSanitizer.Sanitize(runId));

        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(runRepository, scopeContextProvider, taskRepository, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);

        if (run.Status is ArchitectureRunStatus.Failed or ArchitectureRunStatus.ExecutionCompletedQualityRejected)
        {
            ScopeContext retryScope = scopeContextProvider.GetCurrentScope();
            if (TryParseRunGuid(runId, out Guid failedRunGuid))
                await DurableAuditLogRetry.TryLogAsync(async ct =>
                    {
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

                        await auditService.LogAsync(retryRequested, ct);
                    }, logger, $"{AuditEventTypes.Run.RetryRequested}:{LogSanitizer.Sanitize(runId)}", cancellationToken,
                    auditEventTypeForMetrics: AuditEventTypes.Run.RetryRequested);
        }

        ExecuteRunResult? idempotent = await TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);
        if (idempotent is not null)
            return idempotent;
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunStarted, actor, runId, null, cancellationToken);
        try
        {
            ArchitectureRequest request = await requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                          throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
            RequestContentSafetyResult safety = await requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);
            if (!safety.IsAllowed)
                throw new InvalidOperationException(string.Join("; ", safety.Reasons));
            IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(runId, cancellationToken);
            if (tasks.Count == 0)
                throw new InvalidOperationException($"No tasks found for run '{runId}'.");
            AgentEvidencePackage evidence = await evidenceBuilder.BuildAsync(runId, request, cancellationToken);

            await _evidencePackageInjectionMitigator.RedactKnownInjectionPatternsAsync(evidence, cancellationToken);

            string scheduledTaskIds = AgentExecutionStateTransitionTaskIds.Format(tasks.ToList());

            if (TryParseRunGuid(runId, out Guid executeTransitionRunId))

                logger.LogInformationAgentExecutionStateTransition(
                    executeTransitionRunId,
                    "execute_enter",
                    "agent_batch_executing",
                    scheduledTaskIds);

            IReadOnlyList<AgentResult> results;

            try
            {
                results = await agentExecutor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
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

                await TryMarkRunExecuteFailedAsync(runId, partialFailure, cancellationToken);

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

            if (TryParseRunGuid(runId, out Guid afterBatchRunId))

                logger.LogInformationAgentExecutionStateTransition(
                    afterBatchRunId,
                    "agent_batch_executing",
                    "agent_results_persisting",
                    scheduledTaskIds);

            IReadOnlyList<AgentEvaluation> evaluations =
                await agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
            await PersistExecutePhaseAsync(evidence, results, evaluations, cancellationToken);

            if (TryParseRunGuid(runId, out Guid afterPersistRunId))

                logger.LogInformationAgentExecutionStateTransition(
                    afterPersistRunId,
                    "agent_results_persisting",
                    "execute_complete",
                    scheduledTaskIds);
            try
            {
                await outputTraceEvaluationHook.AfterSuccessfulExecuteAsync(runId, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
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
            }

            await TryPromoteRunLegacyStatusIfAllResultsPresentAsync(runId, results, cancellationToken);
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded, actor, runId, $"ResultCount={results.Count}",
                cancellationToken);
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Architecture run execution completed: RunId={RunId}, ResultCount={ResultCount}", LogSanitizer.Sanitize(runId),
                    results.Count);
            return new ExecuteRunResult { RunId = runId, Results = results.ToList() };
        }
        catch (RunCostBudgetExceededPartialPersistRecordedException)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not AgentOutputQualityGateRejectedException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarningArchitectureRunExecutionFailed(ex, runId, ex.GetType().Name);

            AgentExecutionFailureSummary failureSummary = AgentExecutionFailureSummaryFactory.FromException(ex);
            await TryMarkRunExecuteFailedAsync(runId, failureSummary, cancellationToken);
            await baselineMutationAudit.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                actor,
                runId,
                FormatExecuteRunFailureAuditDetails(failureSummary),
                cancellationToken);
            throw;
        }
    }

    /// <summary>
    ///     Idempotency: <see cref = "ArchitectureRunStatus.ReadyForCommit"/> and <see cref = "ArchitectureRunStatus.Committed"/>
    ///     are terminal;
    ///     returns stored results or throws when the run record contradicts stored agent outputs.
    /// </summary>
    private async Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(ArchitectureRun run, string runId, CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentResult> existingResults = await resultRepository.GetByRunIdAsync(runId, cancellationToken);
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
            await taskRepository.GetByRunIdAsync(runId, cancellationToken);

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
        await TryPromoteRunLegacyStatusIfAllResultsPresentAsync(runId, existingResults, cancellationToken);
        return new ExecuteRunResult { RunId = runId, Results = existingResults.ToList() };
    }

    /// <summary>
    ///     ADR-0012: execute no longer wrote <c>LegacyRunStatus</c>; clients and UIs still expect
    ///     <see cref = "ArchitectureRunStatus.ReadyForCommit"/>
    ///     once all required agent outputs exist (matches commit prerequisites and orchestrator contract).
    /// </summary>
    private async Task TryPromoteRunLegacyStatusIfAllResultsPresentAsync(string runId, IReadOnlyList<AgentResult> results, CancellationToken cancellationToken)
    {
        if (!_runStateTransitionService.HasAllRequiredAgentResults(results))
            return;
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);
        if (header is null)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Execute: cannot promote run {RunId} — dbo.Runs header missing.", LogSanitizer.Sanitize(runId));
            return;
        }

        string previousLegacyRunStatus = header.LegacyRunStatus ?? "";
        if (!_runStateTransitionService.ShouldPromoteLegacyStatusToReadyForCommit(previousLegacyRunStatus))
            return;
        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit);
        header.StructuralExecutionMode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            _agentExecutionOptions.Value,
            header.RealModeFellBackToSimulator);
        await runRepository.UpdateAsync(header, cancellationToken);
        string actor = actorContext.GetActor();
        await DurableAuditLogRetry.TryLogAsync(async ct =>
            {
                AuditEvent auditEvent = new()
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
                await auditService.LogAsync(auditEvent, ct);
            }, logger, $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}", cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
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

    private async Task TryMarkRunExecuteFailedAsync(string runId, AgentExecutionFailureSummary summary, CancellationToken cancellationToken)
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

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed);
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await runRepository.UpdateAsync(header, cancellationToken);
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
        if (uow.SupportsExternalTransaction)
        {
            await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);
            await resultRepository.CreateManyAsync(results, cancellationToken, uow.Connection, uow.Transaction);
            await agentEvaluationRepository.CreateManyAsync(evaluations, cancellationToken, uow.Connection, uow.Transaction);
        }
        else
        {
            await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
            await resultRepository.CreateManyAsync(results, cancellationToken);
            await agentEvaluationRepository.CreateManyAsync(evaluations, cancellationToken);
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

        if (tasks.Count == 0 || existingResults.Count != tasks.Count)
            return false;

        HashSet<string> outstanding = tasks.Select(t => t.TaskId).ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (outstanding.Count != tasks.Count)
            return false;

        if (existingResults.Any(result => !outstanding.Remove(result.TaskId)))
            return false;

        return outstanding.Count == 0;
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

        if (uow.SupportsExternalTransaction)
        {
            await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);

            foreach (AgentResult result in results)
                await resultRepository.CreateAsync(result, cancellationToken, uow.Connection, uow.Transaction);

            if (evaluations.Count > 0)
                await agentEvaluationRepository.CreateManyAsync(evaluations, cancellationToken, uow.Connection, uow.Transaction);

            return;
        }

        await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);

        foreach (AgentResult result in results)
            await resultRepository.CreateAsync(result, cancellationToken);

        if (evaluations.Count > 0)
            await agentEvaluationRepository.CreateManyAsync(evaluations, cancellationToken);
    }
}
