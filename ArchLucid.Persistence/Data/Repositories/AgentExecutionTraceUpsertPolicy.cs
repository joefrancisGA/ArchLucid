using ArchLucid.Contracts.Agents;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared upsert rules for <see cref="AgentExecutionTrace" /> rows across SQL and in-memory repositories.
/// </summary>
/// <remarks>
///     SQL enforces the same policy via <c>DeleteLaterAttempts</c> and <c>DeleteSameAttempt</c> statements.
/// </remarks>
internal static class AgentExecutionTraceUpsertPolicy
{
    public static bool SharesRunTaskAgent(AgentExecutionTrace left, AgentExecutionTrace right) =>
        string.Equals(left.RunId, right.RunId, StringComparison.Ordinal)
        && string.Equals(left.TaskId, right.TaskId, StringComparison.OrdinalIgnoreCase)
        && left.AgentType == right.AgentType;

    /// <summary>
    ///     Returns whether an existing trace row should be removed before inserting <paramref name="incoming" />.
    /// </summary>
    public static bool ShouldRemoveExisting(AgentExecutionTrace existing, AgentExecutionTrace incoming)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(incoming);

        if (!SharesRunTaskAgent(existing, incoming))
            return false;

        // Re-executing attempt 0 invalidates every retry that followed it (TB-035).
        if (incoming.AttemptIndex == 0)
            return true;

        return existing.AttemptIndex == incoming.AttemptIndex;
    }
}
