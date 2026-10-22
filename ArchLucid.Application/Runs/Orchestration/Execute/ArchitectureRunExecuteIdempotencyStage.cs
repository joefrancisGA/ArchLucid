using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteIdempotencyStage" />
public sealed class ArchitectureRunExecuteIdempotencyStage(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IRunStateTransitionService runStateTransitionService,
    IOperationCancellationRegistry operationCancellationRegistry,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    IActorContext actorContext,
    ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
    ILogger<ArchitectureRunExecuteIdempotencyStage> logger) : IArchitectureRunExecuteIdempotencyStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IAgentResultRepository _resultRepository =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IOperationCancellationRegistry _operationCancellationRegistry =
        operationCancellationRegistry ?? throw new ArgumentNullException(nameof(operationCancellationRegistry));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly ILogger<ArchitectureRunExecuteIdempotencyStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken)
    {
        ScopeContext idempotencyScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> existingResults =
            await _resultRepository.GetByRunIdAsync(idempotencyScope, runId, cancellationToken);

        if (_runStateTransitionService.IsExecuteIdempotentTerminalStatus(run.Status))
        {
            if (existingResults.Count > 0)
            {
                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation(
                        "ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount}",
                        LogSanitizer.Sanitize(runId),
                        run.Status,
                        existingResults.Count);
                }

                return new ExecuteRunResult { RunId = runId, Results = existingResults.ToList() };
            }

            throw new ConflictException(
                $"Run '{runId}' is in status '{run.Status}' but has no stored agent results. " +
                "The run is in an inconsistent state and cannot be safely re-executed.");
        }

        if (run.Status != ArchitectureRunStatus.TasksGenerated || existingResults.Count <= 0)
            return null;

        IReadOnlyList<AgentTask> scheduledTasks =
            await _taskRepository.GetByRunIdAsync(idempotencyScope, runId, cancellationToken);

        if (!ArePersistedResultsCompleteForTasks(scheduledTasks, existingResults))
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "ExecuteRunAsync skipping idempotent early return: stored results are incomplete versus scheduled tasks for RunId={RunId}, StoredCount={StoredCount}, TaskCount={TaskCount}",
                    LogSanitizer.Sanitize(runId),
                    existingResults.Count,
                    scheduledTasks.Count);
            }

            return null;
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "ExecuteRunAsync is idempotent: returning existing results for RunId={RunId}, Status={Status}, ResultCount={ResultCount} (legacy status may lag)",
                LogSanitizer.Sanitize(runId),
                run.Status,
                existingResults.Count);
        }

        await TryApplyExecuteCompletionLegacyStatusAsync(runId, existingResults, cancellationToken);
        return new ExecuteRunResult { RunId = runId, Results = existingResults.ToList() };
    }

    /// <inheritdoc />
    public async Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Execute: cannot update run {RunId} status — dbo.Runs header missing.",
                    LogSanitizer.Sanitize(runId));
            }

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
        {
            return;
        }

        header.LegacyRunStatus = derived.ToString();

        if (header.GoldenManifestId is null)
        {
            IReadOnlyList<AgentResult> persistedResults =
                await _resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

            StructuralExecutionMode? rollup =
                RunStructuralExecutionModeRollup.TryResolveFromStampedResults(persistedResults);

            if (rollup is not null)
            {
                header.StructuralExecutionMode = rollup.Value;
            }
            else if (derived is ArchitectureRunStatus.ReadyForCommit)
            {
                header.StructuralExecutionMode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
                    EffectiveAgentExecutionOptions(),
                    header.RealModeFellBackToSimulator);
            }
        }

        await _runRepository.UpdateAsync(header, cancellationToken);

        if (derived is not ArchitectureRunStatus.ReadyForCommit)
            return;

        string actor = _actorContext.GetActor();
        await _postExecuteHooks.LogLegacyReadyForCommitPromotedAsync(
            runId,
            actor,
            runGuid,
            scope,
            previousLegacyRunStatus,
            header.LegacyRunStatus,
            cancellationToken);
    }

    /// <inheritdoc />
    public bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults) =>
        ArePersistedResultsCompleteForTasksCore(tasks, existingResults);

    internal static bool ArePersistedResultsCompleteForTasksCore(
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

    private AgentExecutionOptions EffectiveAgentExecutionOptions()
    {
        return new AgentExecutionOptions
        {
            Mode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
        };
    }
}
