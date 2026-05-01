namespace ArchLucid.AgentRuntime;

/// <summary>
///     Limits concurrent LLM-backed agent handlers and caps per-handler wall time (Polly timeout).
/// </summary>
/// <remarks>
///     Bound from configuration under <c>AgentExecution:Resilience</c>.
///     <see cref="MaxConcurrentHandlers" /> ≤ 0 disables the bulkhead (unlimited parallelism — tests only).
///     <see cref="PerHandlerTimeoutSeconds" /> ≤ 0 disables the timeout pipeline.
/// </remarks>
public sealed class AgentExecutionResilienceOptions
{
    public const string SectionName = "AgentExecution:Resilience";

    /// <summary>Maximum agent handlers executing LLM work at once across the process (singleton gate). Default 8.</summary>
    public int MaxConcurrentHandlers
    {
        get;
        set;
    } = 8;

    /// <summary>Per-handler wall-clock timeout in seconds. Default 900 (15 minutes). 0 = disabled.</summary>
    public int PerHandlerTimeoutSeconds
    {
        get;
        set;
    } = 900;

    /// <summary>
    ///     Optional overrides keyed by <see cref="ArchLucid.Contracts.Common.AgentTypeKeys" /> (e.g. <c>topology</c>). 0 in
    ///     map falls back to <see cref="PerHandlerTimeoutSeconds" />.
    /// </summary>
    public Dictionary<string, int> PerAgentTimeoutSeconds
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Retry attempts before a failure is recorded against the circuit breaker. Default 3. 0 = no retry.</summary>
    public int LlmCallMaxRetryAttempts
    {
        get;
        set;
    } = 3;

    /// <summary>Base delay in milliseconds for exponential backoff with jitter between LLM retries. Default 500.</summary>
    public int LlmCallBaseDelayMilliseconds
    {
        get;
        set;
    } = 500;

    /// <summary>Maximum delay cap in seconds for any single retry backoff. Default 10.</summary>
    public int LlmCallMaxDelaySeconds
    {
        get;
        set;
    } = 10;

    /// <summary>Clamps resilience settings to safe ranges (call after binding from configuration).</summary>
    public void Normalize()
    {
        LlmCallMaxRetryAttempts = Math.Clamp(LlmCallMaxRetryAttempts, 0, 10);
        LlmCallBaseDelayMilliseconds = Math.Clamp(LlmCallBaseDelayMilliseconds, 50, 30_000);
        LlmCallMaxDelaySeconds = Math.Clamp(LlmCallMaxDelaySeconds, 1, 120);
        PerHandlerTimeoutSeconds = Math.Clamp(PerHandlerTimeoutSeconds, 0, 86400);
    }

    /// <summary>
    ///     Resolved Polly timeout seconds for an agent dispatch key. When <see cref="PerHandlerTimeoutSeconds" /> is 0, agent
    ///     timeouts are disabled globally.
    /// </summary>
    public int ResolveTimeoutSecondsForAgent(string dispatchKey)
    {
        Normalize();

        if (PerHandlerTimeoutSeconds <= 0)
            return 0;

        if (string.IsNullOrWhiteSpace(dispatchKey) ||
            !PerAgentTimeoutSeconds.TryGetValue(dispatchKey.Trim(), out int raw))
            return PerHandlerTimeoutSeconds;

        int clamped = Math.Clamp(raw, 0, 86400);

        return clamped > 0 ? clamped : PerHandlerTimeoutSeconds;
    }
}
