namespace ArchLucid.AgentRuntime;

/// <summary>Metric label values for <see cref="AgentExecuteIdempotentResultPolicy" /> skip decisions.</summary>
public static class AgentExecuteIdempotentSkipReasonCodes
{
    /// <summary>Persisted non-degraded result with meaningful output exists for the task.</summary>
    public const string PersistedSuccessfulResult = "persisted_successful_result";
}
