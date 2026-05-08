using System.Text.Json;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Decisions;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
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
public sealed class ArchitectureRunExecuteOrchestrator(IRunRepository runRepository, IScopeContextProvider scopeContextProvider, IArchitectureRequestRepository requestRepository, IAgentTaskRepository taskRepository, IAgentExecutor agentExecutor, IAgentEvaluationService agentEvaluationService, IAgentResultRepository resultRepository, IAgentEvaluationRepository agentEvaluationRepository, IAgentEvidencePackageRepository agentEvidencePackageRepository, IEvidenceBuilder evidenceBuilder, IActorContext actorContext, IBaselineMutationAuditService baselineMutationAudit, IAuditService auditService, IArchLucidUnitOfWorkFactory unitOfWorkFactory, IAgentOutputTraceEvaluationHook outputTraceEvaluationHook, IRequestContentSafetyPrecheck requestContentSafetyPrecheck, IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions, ILogger<ArchitectureRunExecuteOrchestrator> logger) : IArchitectureRunExecuteOrchestrator
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));
    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));
    private readonly IAgentOutputTraceEvaluationHook _outputTraceEvaluationHook = outputTraceEvaluationHook ?? throw new ArgumentNullException(nameof(outputTraceEvaluationHook));
    private readonly ILogger<ArchitectureRunExecuteOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IAgentEvaluationService _agentEvaluationService = agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));
    private readonly IAgentEvaluationRepository _agentEvaluationRepository = agentEvaluationRepository ?? throw new ArgumentNullException(nameof(agentEvaluationRepository));
    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository = agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IEvidenceBuilder _evidenceBuilder = evidenceBuilder ?? throw new ArgumentNullException(nameof(evidenceBuilder));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly IBaselineMutationAuditService _baselineMutationAudit = baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));
    private readonly IAgentExecutor _agentExecutor = agentExecutor ?? throw new ArgumentNullException(nameof(agentExecutor));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));
    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck = requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));
    /// <summary>One persisted result per required agent type (Topology, Cost, Compliance, Critic) before commit.</summary>
    private static readonly HashSet<AgentType> RequiredAgentTypesForCommit = [AgentType.Topology, AgentType.Cost, AgentType.Compliance, AgentType.Critic];
    /// <inheritdoc/>
    public async Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ValidateDependencies(runRepository, scopeContextProvider, requestRepository, taskRepository, agentExecutor, agentEvaluationService, resultRepository, agentEvaluationRepository, agentEvidencePackageRepository, evidenceBuilder, actorContext, baselineMutationAudit, auditService, unitOfWorkFactory, outputTraceEvaluationHook, requestContentSafetyPrecheck, agentOutputQualityGateOptions, logger);
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

    private static void ValidateDependencies(IRunRepository runRepository, IScopeContextProvider scopeContextProvider, IArchitectureRequestRepository requestRepository, IAgentTaskRepository taskRepository, IAgentExecutor agentExecutor, IAgentEvaluationService agentEvaluationService, IAgentResultRepository resultRepository, IAgentEvaluationRepository agentEvaluationRepository, IAgentEvidencePackageRepository agentEvidencePackageRepository, IEvidenceBuilder evidenceBuilder, IActorContext actorContext, IBaselineMutationAuditService baselineMutationAudit, IAuditService auditService, IArchLucidUnitOfWorkFactory unitOfWorkFactory, IAgentOutputTraceEvaluationHook outputTraceEvaluationHook, IRequestContentSafetyPrecheck requestContentSafetyPrecheck, IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions, ILogger<ArchitectureRunExecuteOrchestrator> logger)
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
        ArgumentNullException.ThrowIfNull(requestContentSafetyPrecheck);
        ArgumentNullException.ThrowIfNull(agentOutputQualityGateOptions);
        ArgumentNullException.ThrowIfNull(logger);
    }

    private async Task<ExecuteRunResult> ExecuteRunCoreAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Executing architecture run: RunId={RunId}", LogSanitizer.Sanitize(runId));
        ArchitectureRun? run = await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(runRepository, scopeContextProvider, taskRepository, runId, cancellationToken);
        if (run is null)
            throw new RunNotFoundException(runId);
        if (run.Status == ArchitectureRunStatus.Failed ||
            run.Status == ArchitectureRunStatus.ExecutionCompletedQualityRejected)
        {
            ScopeContext retryScope = scopeContextProvider.GetCurrentScope();
            if (TryParseRunGuid(runId, out Guid failedRunGuid))
                await DurableAuditLogRetry.TryLogAsync(async ct =>
                {
                    await auditService.LogAsync(new AuditEvent { EventType = AuditEventTypes.Run.RetryRequested, ActorUserId = actor, ActorUserName = actor, TenantId = retryScope.TenantId, WorkspaceId = retryScope.WorkspaceId, ProjectId = retryScope.ProjectId, RunId = failedRunGuid, DataJson = JsonSerializer.Serialize(new { runId, previousStatus = run.Status.ToString() }, AuditJsonSerializationOptions.Instance) }, ct);
                }, logger, $"{AuditEventTypes.Run.RetryRequested}:{LogSanitizer.Sanitize(runId)}", cancellationToken, auditEventTypeForMetrics: AuditEventTypes.Run.RetryRequested);
        }

        ExecuteRunResult? idempotent = await TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);
        if (idempotent is not null)
            return idempotent;
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunStarted, actor, runId, null, cancellationToken);
        try
        {
            ArchitectureRequest request = await requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ?? throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
            RequestContentSafetyResult safety = await requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);
            if (!safety.IsAllowed)
                throw new InvalidOperationException(string.Join("; ", safety.Reasons));
            IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(runId, cancellationToken);
            if (tasks.Count == 0)
                throw new InvalidOperationException($"No tasks found for run '{runId}'.");
            AgentEvidencePackage evidence = await evidenceBuilder.BuildAsync(runId, request, cancellationToken);
            IReadOnlyList<AgentResult> results = await agentExecutor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
            IReadOnlyList<AgentEvaluation> evaluations = await agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
            await PersistExecutePhaseAsync(evidence, results, evaluations, cancellationToken);
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
                    logger.LogWarning(ex, "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged.", LogSanitizer.Sanitize(runId));
            }

            await TryPromoteRunLegacyStatusIfAllResultsPresentAsync(runId, results, cancellationToken);
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded, actor, runId, $"ResultCount={results.Count}", cancellationToken);
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Architecture run execution completed: RunId={RunId}, ResultCount={ResultCount}", LogSanitizer.Sanitize(runId), results.Count);
            return new ExecuteRunResult
            {
                RunId = runId,
                Results = results.ToList()
            };
        }
        catch (Exception ex)when (ex is not OperationCanceledException and not AgentOutputQualityGateRejectedException)
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
        if (run.Status is ArchitectureRunStatus.ReadyForCommit or ArchitectureRunStatus.Committed)
        {
            if (existingResults.Count > 0)
            {
                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount}", LogSanitizer.Sanitize(runId), run.Status, existingResults.Count);
                return new ExecuteRunResult
                {
                    RunId = runId,
                    Results = existingResults.ToList()
                };
            }

            throw new ConflictException($"Run '{runId}' is in status '{run.Status}' but has no stored agent results. " + "The run is in an inconsistent state and cannot be safely re-executed.");
        }

        // Authority LegacyRunStatus may still read TasksGenerated while execute results already exist; idempotency uses stored results.
        if (run.Status != ArchitectureRunStatus.TasksGenerated || existingResults.Count <= 0)
            return null;
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount} (legacy status may lag)", LogSanitizer.Sanitize(runId), run.Status, existingResults.Count);
        await TryPromoteRunLegacyStatusIfAllResultsPresentAsync(runId, existingResults, cancellationToken);
        return new ExecuteRunResult
        {
            RunId = runId,
            Results = existingResults.ToList()
        };
    }

    private static bool HasAllRequiredAgentTypesForCommit(IReadOnlyList<AgentResult> results)
    {
        if (results.Count != RequiredAgentTypesForCommit.Count)
            return false;
        foreach (AgentType required in RequiredAgentTypesForCommit)
            if (results.Count(r => r.AgentType == required) != 1)
                return false;
        return true;
    }

    /// <summary>
    ///     ADR-0012: execute no longer wrote <c>LegacyRunStatus</c>; clients and UIs still expect
    ///     <see cref = "ArchitectureRunStatus.ReadyForCommit"/>
    ///     once all required agent outputs exist (matches commit prerequisites and orchestrator contract).
    /// </summary>
    private async Task TryPromoteRunLegacyStatusIfAllResultsPresentAsync(string runId, IReadOnlyList<AgentResult> results, CancellationToken cancellationToken)
    {
        if (!HasAllRequiredAgentTypesForCommit(results))
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
        if (string.Equals(previousLegacyRunStatus, nameof(ArchitectureRunStatus.ReadyForCommit), StringComparison.OrdinalIgnoreCase) || string.Equals(previousLegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;
        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit);
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
                DataJson = JsonSerializer.Serialize(new { runId, previousLegacyRunStatus, newLegacyRunStatus = header.LegacyRunStatus }, AuditJsonSerializationOptions.Instance)
            };
            await auditService.LogAsync(auditEvent, ct);
        }, logger, $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}", cancellationToken, auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
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
        header.CompletedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await runRepository.UpdateAsync(header, cancellationToken);
    }

    /// <summary>
    ///     Persists evidence, results, and evaluations inside one transaction so retries do not duplicate rows.
    /// </summary>
    private async Task PersistExecutePhaseAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results, IReadOnlyList<AgentEvaluation> evaluations, CancellationToken cancellationToken)
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

    private async Task PersistExecutePhaseRowsAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results, IReadOnlyList<AgentEvaluation> evaluations, IArchLucidUnitOfWork uow, CancellationToken cancellationToken)
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
}