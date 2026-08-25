using System.Text.Json;

using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Selective execute, idempotency, retry audit, and cooperative cancellation pre-checks.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{

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
}
