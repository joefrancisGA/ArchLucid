using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Wraps an inner <see cref="IAgentExecutor" /> (typically <c>DeterministicAgentSimulator</c>) with the same
///     per-task persisted-result skip semantics as <see cref="RealAgentExecutor" /> (TB-039).
/// </summary>
public sealed class IdempotentAgentExecutor(
    IAgentExecutor innerExecutor,
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider,
    ILogger<IdempotentAgentExecutor> logger) : IAgentExecutor
{
    private readonly IAgentExecutor _innerExecutor = innerExecutor ?? throw new ArgumentNullException(nameof(innerExecutor));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<IdempotentAgentExecutor> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(tasks);

        AgentTask[] orderedTasks = tasks
            .OrderBy(AgentTypeKeys.ResolveDispatchKey, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (orderedTasks.Length == 0)
            return [];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> persistedResults =
            await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyDictionary<string, AgentResult> persistedByTaskId =
            AgentExecuteIdempotentResultIndex.BuildLatestByTaskId(persistedResults);

        List<AgentTask> tasksToExecute = [];
        Dictionary<string, AgentResult> skippedByTaskId = new(StringComparer.Ordinal);

        foreach (AgentTask task in orderedTasks)
        {
            persistedByTaskId.TryGetValue(task.TaskId, out AgentResult? persistedResult);

            if (AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(persistedResult, out string? skipReason))
            {
                ArchLucidInstrumentation.AgentExecuteTaskSkippedIdempotentTotal.Add(
                    1,
                    new KeyValuePair<string, object?>("agent_type", task.AgentType.ToString()),
                    new KeyValuePair<string, object?>("reason", skipReason ?? "unknown"));

                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Skipping idempotent simulator execute for RunId={RunId} TaskId={TaskId} Agent={AgentType} Reason={Reason}.",
                        LogSanitizer.Sanitize(runId),
                        LogSanitizer.Sanitize(task.TaskId),
                        LogSanitizer.Sanitize(AgentTypeKeys.ResolveDispatchKey(task)),
                        LogSanitizer.Sanitize(skipReason ?? string.Empty));
                }

                skippedByTaskId[task.TaskId] = persistedResult!;
                continue;
            }

            tasksToExecute.Add(task);
        }

        IReadOnlyList<AgentResult> freshResults = tasksToExecute.Count == 0
            ? []
            : await _innerExecutor.ExecuteAsync(runId, request, evidence, tasksToExecute, cancellationToken).ConfigureAwait(false);

        Dictionary<string, AgentResult> freshByTaskId = freshResults
            .ToDictionary(static result => result.TaskId, static result => result, StringComparer.Ordinal);

        List<AgentResult> merged = [];

        foreach (AgentTask task in orderedTasks)
        {
            if (skippedByTaskId.TryGetValue(task.TaskId, out AgentResult? skipped))
            {
                merged.Add(skipped);
                continue;
            }

            if (!freshByTaskId.TryGetValue(task.TaskId, out AgentResult? fresh))
            {
                throw new InvalidOperationException(
                    $"Simulator execute retry did not produce a result for task '{task.TaskId}' on run '{runId}'.");
            }

            merged.Add(fresh);
        }

        return merged;
    }
}
