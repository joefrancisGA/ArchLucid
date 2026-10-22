namespace ArchLucid.Core.Configuration;

/// <summary>
///     Per-tenant total LLM token budget (prompt + completion) aligned to the UTC calendar day — separate from the sliding
///     <see cref="LlmTokenQuotaOptions" /> window. Bound from configuration section <see cref="SectionName" />.
/// </summary>
public sealed class LlmDailyTenantTokenWindowOptions
{
    /// <summary>Configuration path; kept as <c>LlmDailyTenantBudget</c> for deployment continuity.</summary>
    public const string SectionName = "LlmDailyTenantBudget";

    /// <summary>
    ///     When true, <see cref="ArchLucid.AgentRuntime.LlmCompletionAccountingClient" /> enforces the daily cap
    ///     (non-simulator providers only).
    /// </summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Hard stop: maximum combined prompt + completion tokens per tenant per UTC day.</summary>
    public long HardCutoffTokensPerUtcDay
    {
        get;
        set;
    } = 2_000_000;

    /// <summary>
    ///     When cumulative usage reaches this fraction of <see cref="HardCutoffTokensPerUtcDay" />, emit a single
    ///     durable audit per tenant per UTC day.
    /// </summary>
    public decimal WarnFraction
    {
        get;
        set;
    } = 0.8m;

    /// <summary>
    ///     Upper bound on total tokens assumed for the in-flight request when checking the budget before the model
    ///     returns usage.
    /// </summary>
    public int AssumedMaxTotalTokensPerRequest
    {
        get;
        set;
    } = 65_536;
}
