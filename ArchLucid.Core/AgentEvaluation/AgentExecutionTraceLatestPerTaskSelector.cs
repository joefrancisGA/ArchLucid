using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Picks the newest trace per <see cref="AgentExecutionTrace.TaskId" /> so superseded auto-retry attempts do not
///     affect downstream evaluation. Ordering is <see cref="AgentExecutionTrace.AttemptIndex" /> first (TB-035), then
///     <see cref="AgentExecutionTrace.CreatedUtc" />, then <see cref="AgentExecutionTrace.TraceId" />.
/// </summary>
public static class AgentExecutionTraceLatestPerTaskSelector
{
    public static IReadOnlyList<AgentExecutionTrace> Select(IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        if (traces.Count <= 1)
            return traces;

        List<AgentExecutionTrace> latest = traces
            .GroupBy(GetLatestPerTaskKey, StringComparer.OrdinalIgnoreCase)
            .Select(static g => g
                .OrderByDescending(static t => t.AttemptIndex)
                .ThenByDescending(static t => t.CreatedUtc)
                .ThenByDescending(static t => t.TraceId, StringComparer.Ordinal)
                .First())
            .ToList();

        return latest;
    }

    private static string GetLatestPerTaskKey(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        string? taskId = trace.TaskId?.Trim();

        if (!string.IsNullOrWhiteSpace(taskId))
            return taskId;

        // Missing TaskId must not collapse unrelated agent traces into one retry chain, but retries for the
        // same agent type within a run should still prefer the highest AttemptIndex.
        return FormattableString.Invariant($"agent:{trace.AgentType}");
    }
}
