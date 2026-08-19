using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Picks the newest trace per <see cref="AgentExecutionTrace.TaskId" /> so superseded auto-retry attempts do not
///     affect downstream evaluation.
/// </summary>
public static class AgentExecutionTraceLatestPerTaskSelector
{
    public static IReadOnlyList<AgentExecutionTrace> Select(IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        if (traces.Count <= 1)
            return traces;

        List<AgentExecutionTrace> latest = traces
            .GroupBy(static t => t.TaskId, StringComparer.OrdinalIgnoreCase)
            .Select(static g => g
                .OrderByDescending(static t => t.CreatedUtc)
                .ThenByDescending(static t => t.AttemptIndex)
                .ThenByDescending(static t => t.TraceId, StringComparer.Ordinal)
                .First())
            .ToList();

        return latest;
    }
}
