using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Picks the newest trace per <see cref="AgentExecutionTrace.TaskId" /> so superseded auto-retry attempts do not
///     affect downstream evaluation. Ordering is <see cref="AgentExecutionTrace.AttemptIndex" /> first (TB-035), then
///     quality-preference rank for upsert-drift duplicate rows (unevaluated snapshots rank below recorded
///     outcomes), then <see cref="AgentExecutionTrace.CreatedUtc" />,
///     then <see cref="AgentExecutionTrace.TraceId" />.
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
                .ThenByDescending(QualityPreferenceRank)
                .ThenByDescending(static t => t.CreatedUtc)
                .ThenByDescending(static t => t.TraceId, StringComparer.Ordinal)
                .First())
            .ToList();

        return latest;
    }

    private static int QualityPreferenceRank(AgentExecutionTrace trace)
    {
        if (trace.QualityRejected
            || trace.RecordedQualityGateOutcome == AgentOutputQualityGateOutcome.Rejected)
            return 1;

        if (trace.RecordedQualityGateOutcome == AgentOutputQualityGateOutcome.Warned)
            return 2;

        if (trace.RecordedQualityGateOutcome == AgentOutputQualityGateOutcome.Accepted)
            return 3;

        // Upsert-drift duplicate rows can retain stale unevaluated snapshots; never prefer them
        // over a sibling row that already recorded a quality-gate outcome.
        return 0;
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
