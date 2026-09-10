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

    /// <summary>
    ///     Execute ran before any <c>AgentTask</c> rows existed (deferred authority pipeline not resumed).
    ///     Persisted on <c>LastFailureReason.reasonCode</c> so operators are not left with a bare
    ///     <c>failureClass=invalidOperation</c>.
    /// </summary>
    public const string NoScheduledAgentTasks = nameof(NoScheduledAgentTasks);

    /// <summary>
    ///     Re-run/resume could not load the architecture request needed to restart the deferred pipeline.
    /// </summary>
    public const string MissingArchitectureRequest = nameof(MissingArchitectureRequest);

    /// <summary>
    ///     Execute ownership lease expired without renewal — worker lost mid-run (TB-943 / DR-06).
    /// </summary>
    public const string ExecuteOwnershipLeaseExpired = nameof(ExecuteOwnershipLeaseExpired);
}
