using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

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
    IRunExecuteOwnershipLeaseService runExecuteOwnershipLeaseService,
    IArchitectureRunExecutePreExecuteStage preExecuteStage,
    IArchitectureRunExecuteAgentLoopStage agentLoopStage,
    IArchitectureRunExecuteScopeResolveStage scopeResolveStage,
    IArchitectureRunExecuteTelemetryStage telemetryStage,
    IArchitectureRunExecuteTailHooksStage tailHooksStage,
    IIncompleteAuthorityPipelineExecuteHandler incompleteAuthorityPipelineExecuteHandler)
    : IArchitectureRunExecuteOrchestrator
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly IOptions<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IIncompleteAuthorityPipelineExecuteHandler _incompleteAuthorityPipelineExecuteHandler =
        incompleteAuthorityPipelineExecuteHandler
        ?? throw new ArgumentNullException(nameof(incompleteAuthorityPipelineExecuteHandler));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IRunExecuteOwnershipLeaseService _runExecuteOwnershipLeaseService =
        runExecuteOwnershipLeaseService ?? throw new ArgumentNullException(nameof(runExecuteOwnershipLeaseService));

    private readonly IArchitectureRunExecutePreExecuteStage _preExecuteStage =
        preExecuteStage ?? throw new ArgumentNullException(nameof(preExecuteStage));

    private readonly IArchitectureRunExecuteAgentLoopStage _agentLoopStage =
        agentLoopStage ?? throw new ArgumentNullException(nameof(agentLoopStage));

    private readonly IArchitectureRunExecuteScopeResolveStage _scopeResolveStage =
        scopeResolveStage ?? throw new ArgumentNullException(nameof(scopeResolveStage));

    private readonly IArchitectureRunExecuteTelemetryStage _telemetryStage =
        telemetryStage ?? throw new ArgumentNullException(nameof(telemetryStage));

    private readonly IArchitectureRunExecuteTailHooksStage _tailHooksStage =
        tailHooksStage ?? throw new ArgumentNullException(nameof(tailHooksStage));

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
            agentLoopStage);
        string actor = actorContext.GetActor();
        try
        {
            if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid) && _runExecuteOwnershipLeaseService.IsEnabled)
            {
                await EnsureExecuteRunExistsAsync(runId, cancellationToken).ConfigureAwait(false);

                await _runExecuteOwnershipLeaseService.AcquireAsync(runGuid, cancellationToken).ConfigureAwait(false);

                using CancellationTokenSource executeCancellation =
                    CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

                IAsyncDisposable renewalScope = _runExecuteOwnershipLeaseService.BeginRenewalScope(
                    runGuid,
                    executeCancellation);

                try
                {
                    return await ExecuteRunCoreAsync(runId, actor, executeCancellation.Token).ConfigureAwait(false);
                }
                finally
                {
                    await renewalScope.DisposeAsync().ConfigureAwait(false);

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
            agentLoopStage);

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

        await _scopeResolveStage.ThrowIfAuthorityPipelineCompleteAsync(run, runId, cancellationToken);

        if (run.Status is ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Run '{runId}' is already committed and cannot be selectively re-executed.");
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> scheduledTasks = await taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (scheduledTasks.Count == 0)
            throw new NoScheduledAgentTasksException(runId);

        IReadOnlyList<AgentTask> forcedTasks = SelectiveAgentExecutePlanner.ResolveTasksToForce(scheduledTasks, request);

        await EnsureSelectiveExecuteStillEligibleAsync(runId, cancellationToken).ConfigureAwait(false);

        if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid)
            && _runExecuteOwnershipLeaseService.IsEnabled)
        {
            await _runExecuteOwnershipLeaseService.AcquireAsync(runGuid, cancellationToken).ConfigureAwait(false);

            using CancellationTokenSource executeCancellation =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            IAsyncDisposable renewalScope = _runExecuteOwnershipLeaseService.BeginRenewalScope(
                runGuid,
                executeCancellation);

            try
            {
                return await ExecuteSelectiveRunOwnedCoreAsync(
                    runId,
                    actor,
                    forcedTasks,
                    request,
                    executeCancellation.Token).ConfigureAwait(false);
            }
            finally
            {
                await renewalScope.DisposeAsync().ConfigureAwait(false);

                await _runExecuteOwnershipLeaseService
                    .ReleaseAsync(runGuid, CancellationToken.None)
                    .ConfigureAwait(false);
            }
        }

        return await ExecuteSelectiveRunOwnedCoreAsync(
            runId,
            actor,
            forcedTasks,
            request,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<ExecuteRunResult> ExecuteSelectiveRunOwnedCoreAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken)
    {
        ArchitectureRun currentRun = await EnsureSelectiveExecuteStillEligibleAsync(runId, cancellationToken).ConfigureAwait(false);

        foreach (AgentTask task in forcedTasks)
        {
            await _resultRepository.DeleteForRunTaskAsync(runId, task.TaskId, cancellationToken);
        }

        await _preExecuteStage.TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(runId, currentRun.Status, cancellationToken);
        await _postExecuteHooks.LogSelectiveExecuteRequestedAsync(runId, actor, forcedTasks, request.IncludeDependents, cancellationToken);

        return await ExecuteRunCoreAsync(runId, actor, cancellationToken).ConfigureAwait(false);
    }

    private async Task<ArchitectureRun> EnsureSelectiveExecuteStillEligibleAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRun? currentRun =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
                runRepository,
                scopeContextProvider,
                taskRepository,
                runId,
                cancellationToken).ConfigureAwait(false);

        if (currentRun is null)
            throw new RunNotFoundException(runId);

        if (currentRun.Status is ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Run '{runId}' is already committed and cannot be selectively re-executed.");
        }

        await _scopeResolveStage.ThrowIfAuthorityPipelineCompleteAsync(currentRun, runId, cancellationToken).ConfigureAwait(false);

        return currentRun;
    }

    private async Task EnsureExecuteRunExistsAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
                runRepository,
                scopeContextProvider,
                taskRepository,
                runId,
                cancellationToken).ConfigureAwait(false);

        if (run is null)
            throw new RunNotFoundException(runId);
    }

    internal static bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults) =>
        ArchitectureRunExecuteIdempotencyStage.ArePersistedResultsCompleteForTasksCore(tasks, existingResults);

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
        IArchitectureRunExecuteAgentLoopStage agentLoopStage)
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
    }

    private Task<ExecuteRunResult> ExecuteRunCoreAsync(string runId, string actor, CancellationToken cancellationToken) =>
        _telemetryStage.ExecuteWithTelemetryAsync(
            runId,
            actor,
            ct => ExecuteRunCoreInnerAsync(runId, actor, ct),
            _tailHooksStage.RecordExecuteRunFailureAsync,
            cancellationToken);

    private async Task<ExecuteRunResult> ExecuteRunCoreInnerAsync(string runId, string actor, CancellationToken cancellationToken)
    {
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(runRepository, scopeContextProvider, taskRepository, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId);

        await _scopeResolveStage.ThrowIfAuthorityPipelineCompleteAsync(run, runId, cancellationToken);

        await _tailHooksStage.LogFailedRunRetryRequestedAsync(run, runId, actor, cancellationToken);

        ExecuteRunResult? resumed =
            await _incompleteAuthorityPipelineExecuteHandler.TryResumeAsync(run, runId, cancellationToken);

        if (resumed is not null)
        {
            ArchitectureRun? reloadedRun =
                await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
                    runRepository,
                    scopeContextProvider,
                    taskRepository,
                    runId,
                    cancellationToken);

            if (reloadedRun is null)
                throw new RunNotFoundException(runId);

            run = reloadedRun;
            await _scopeResolveStage.ThrowIfAuthorityPipelineCompleteAsync(run, runId, cancellationToken);
        }

        ExecuteRunResult? idempotent = await _preExecuteStage.TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);

        if (idempotent is not null)
            return idempotent;

        if ((run.TaskIds?.Count ?? 0) == 0
            && string.IsNullOrWhiteSpace(run.ContextSnapshotId)
            && run.Status is not ArchitectureRunStatus.Committed
            and not ArchitectureRunStatus.ReadyForCommit)
        {
            throw new NoScheduledAgentTasksException(runId);
        }

        await _tailHooksStage.EnsurePreAgentLoopExecuteAllowedAsync(runId, actor, cancellationToken);

        return await _agentLoopStage.ExecuteRunAgentBatchAsync(run, runId, actor, cancellationToken);
    }
}
