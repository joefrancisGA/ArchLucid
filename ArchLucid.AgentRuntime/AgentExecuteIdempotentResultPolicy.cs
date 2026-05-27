using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decides whether an execute retry should skip handler dispatch for a task that already has a persisted
///     <see cref="AgentResult" /> (Improvement #1 / TB-039).
/// </summary>
public static class AgentExecuteIdempotentResultPolicy
{
    /// <summary>
    ///     Returns true when <paramref name="existing" /> is a non-degraded persisted row with meaningful output and should
    ///     not be re-invoked on partial-batch retry.
    /// </summary>
    public static bool ShouldSkipRetry(AgentResult? existing, out string? reasonCode)
    {
        reasonCode = null;

        if (existing is null)
            return false;

        if (!string.IsNullOrWhiteSpace(existing.DegradationReasonCode))
            return false;

        if (existing.Claims.Count > 0 || existing.Findings.Count > 0 || existing.Confidence > 0)
        {
            reasonCode = AgentExecuteIdempotentSkipReasonCodes.PersistedSuccessfulResult;

            return true;
        }

        return false;
    }
}
