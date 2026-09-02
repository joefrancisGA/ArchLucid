using System.Diagnostics;

using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration.Execute;
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
using ArchLucid.Core.DevTesting;
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
public sealed class ArchitectureRunExecuteOrchestrator(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IArchitectureRequestRepository requestRepository,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
    IOptions<AgentExecutionOptions> agentExecutionOptions,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    IRunStateTransitionService runStateTransitionService,
    DemoExpensiveActionGate demoExpensiveActionGate,
    IRunExecuteOwnershipLeaseService runExecuteOwnershipLeaseService,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAgentExecutionReadinessGuard agentExecutionReadinessGuard,
    IArchitectureRunExecutePreExecuteStage preExecuteStage,
    IArchitectureRunExecuteAgentLoopStage agentLoopStage,
    ILogger<ArchitectureRunExecuteOrchestrator> logger) : IArchitectureRunExecuteOrchestrator
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly IOptions<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly ILogger<ArchitectureRunExecuteOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly DemoExpensiveActionGate _demoExpensiveActionGate =
        demoExpensiveActionGate ?? throw new ArgumentNullException(nameof(demoExpensiveActionGate));

    private readonly IRunExecuteOwnershipLeaseService _runExecuteOwnershipLeaseService =
        runExecuteOwnershipLeaseService ?? throw new ArgumentNullException(nameof(runExecuteOwnershipLeaseService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAgentExecutionReadinessGuard _agentExecutionReadinessGuard =
        agentExecutionReadinessGuard ?? throw new ArgumentNullException(nameof(agentExecutionReadinessGuard));

    private readonly IArchitectureRunExecutePreExecuteStage _preExecuteStage =
        preExecuteStage ?? throw new ArgumentNullException(nameof(preExecuteStage));

    private readonly IArchitectureRunExecuteAgentLoopStage _agentLoopStage =
        agentLoopStage ?? throw new ArgumentNullException(nameof(agentLoopStage));

    /// <inheritdoc/>
    public async Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ValidateDependencies(
            runRepository,
            scopeContextProvider,
            requestRepository,
            taskRepository,
            resultRepository,
            actorContext,
            baselineMutationAudit,
            postExecuteHooks,
            agentExecutionOptions,
            preExecuteStage,
            agentLoopStage,
            logger);
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
        ValidateDependencies(
            runRepository,
            scopeContextProvider,
            requestRepository,
            taskRepository,
            resultRepository,
            actorContext,
            baselineMutationAudit,
            postExecuteHooks,
            agentExecutionOptions,
            preExecuteStage,
            agentLoopStage,
            logger);

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

        await _preExecuteStage.TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(runId, run.Status, cancellationToken);
        await _postExecuteHooks.LogSelectiveExecuteRequestedAsync(runId, actor, forcedTasks, request.IncludeDependents, cancellationToken);

        return await ExecuteRunAsync(runId, cancellationToken);
    }

    internal static bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults) =>
        ArchitectureRunExecutePreExecuteStage.ArePersistedResultsCompleteForTasks(tasks, existingResults);

    private static void ValidateDependencies(
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IArchitectureRequestRepository requestRepository,
        IAgentTaskRepository taskRepository,
        IAgentResultRepository resultRepository,
        IActorContext actorContext,
        IBaselineMutationAuditService baselineMutationAudit,
        ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
        IOptions<AgentExecutionOptions> agentExecutionOptions,
        IArchitectureRunExecutePreExecuteStage preExecuteStage,
        IArchitectureRunExecuteAgentLoopStage agentLoopStage,
        ILogger<ArchitectureRunExecuteOrchestrator> logger)
    {
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(requestRepository);
        ArgumentNullException.ThrowIfNull(taskRepository);
        ArgumentNullException.ThrowIfNull(resultRepository);
        ArgumentNullException.ThrowIfNull(actorContext);
        ArgumentNullException.ThrowIfNull(baselineMutationAudit);
        ArgumentNullException.ThrowIfNull(postExecuteHooks);
        ArgumentNullException.ThrowIfNull(agentExecutionOptions);
        ArgumentNullException.ThrowIfNull(preExecuteStage);
        ArgumentNullException.ThrowIfNull(agentLoopStage);
        ArgumentNullException.ThrowIfNull(logger);
    }

    private async Task<ExecuteRunResult> ExecuteRunCoreAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        string executionModeLabel =
            AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel(EffectiveAgentExecutionOptions().Mode);

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
                await _postExecuteHooks.RecordExecuteRunFailureAsync(runId, actor, ex, cancellationToken);
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

        await _postExecuteHooks.LogFailedRunRetryRequestedAsync(run, runId, actor, cancellationToken);

        ExecuteRunResult? idempotent = await _preExecuteStage.TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);

        if (idempotent is not null)
            return idempotent;

        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;

        await _demoExpensiveActionGate
            .EnsureExpensiveActionAllowedAsync(tenantId, AiUsageFeature.ArchitectureGeneration, cancellationToken)
            .ConfigureAwait(false);

        await _agentExecutionReadinessGuard.EnsureReadyForExecuteAsync(cancellationToken).ConfigureAwait(false);

        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunStarted, actor, runId, null, cancellationToken);

        return await _agentLoopStage.ExecuteRunAgentBatchAsync(run, runId, actor, cancellationToken);
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

    private AgentExecutionOptions EffectiveAgentExecutionOptions()
    {
        return new AgentExecutionOptions
        {
            Mode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
        };
    }
}
