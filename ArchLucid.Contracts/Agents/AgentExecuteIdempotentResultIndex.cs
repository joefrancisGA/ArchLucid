namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Indexes persisted <see cref="AgentResult" /> rows for execute retry and persist reconciliation (TB-039).
/// </summary>
public static class AgentExecuteIdempotentResultIndex
{
    /// <summary>
    ///     Returns the latest persisted row per <see cref="AgentResult.TaskId" /> (ordered by repository read sequence).
    /// </summary>
    public static Dictionary<string, AgentResult> BuildLatestByTaskId(IReadOnlyList<AgentResult> persistedResults)
    {
        ArgumentNullException.ThrowIfNull(persistedResults);

        return persistedResults
            .GroupBy(static result => result.TaskId, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.Last(), StringComparer.Ordinal);
    }
}
