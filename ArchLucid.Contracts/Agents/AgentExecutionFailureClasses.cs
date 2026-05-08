namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Low-cardinality <c>failureClass</c> values for <see cref="AgentExecutionFailureSummary" /> (API and
///     <c>dbo.Runs.LastFailureReason</c> JSON). Never embed raw LLM or provider error bodies here.
/// </summary>
public static class AgentExecutionFailureClasses
{
    public const string Unknown = "unknown";

    public const string Timeout = "timeout";

    public const string Canceled = "canceled";

    public const string Parse = "parse";

    public const string CircuitBreaker = "circuitBreaker";

    public const string Quota = "quota";

    /// <summary>Per-run estimated token/USD cap breached (CostGuardrail / run budget).</summary>
    public const string CostBudget = "costBudget";

    public const string InvalidOperation = "invalidOperation";

    public const string Dependency = "dependency";
}
