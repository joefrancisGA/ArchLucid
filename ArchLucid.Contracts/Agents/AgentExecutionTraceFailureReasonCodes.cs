namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Stable, low-cardinality codes recorded on <see cref="AgentExecutionTrace.FailureReasonCode" /> when a trace row
///     captures a failure path that operators may want to alert on (distinct from free-text <see cref="AgentExecutionTrace.ErrorMessage" />).
/// </summary>
public static class AgentExecutionTraceFailureReasonCodes
{
    /// <summary>LLM call was rejected because the completion circuit gate was open or a recovery probe was in flight.</summary>
    public const string CircuitBreakerRejected = nameof(CircuitBreakerRejected);

    /// <summary>
    ///     LLM call was rejected before dispatch because per-tenant sliding-window token quota or UTC-day budget would be
    ///     exceeded.
    /// </summary>
    public const string LlmTokenQuotaExceeded = nameof(LlmTokenQuotaExceeded);

    /// <summary>Run-level token or USD cap (per-execute batch) was exceeded after one or more completions.</summary>
    public const string RunCostLimitExceeded = nameof(RunCostLimitExceeded);

    /// <summary>Run-level token budget was exceeded after one or more completions (TB-327).</summary>
    public const string TokenBudgetExceeded = nameof(TokenBudgetExceeded);

    /// <summary>Request content failed the deterministic prompt-injection precheck before execute (TB-325).</summary>
    public const string PromptInjectionDetected = nameof(PromptInjectionDetected);

    /// <summary>
    ///     Structured-output parse or schema validation failed on a schema-remediation attempt (TB-035); a later attempt may
    ///     succeed.
    /// </summary>
    public const string SchemaRemediationParseFailed = nameof(SchemaRemediationParseFailed);
}
