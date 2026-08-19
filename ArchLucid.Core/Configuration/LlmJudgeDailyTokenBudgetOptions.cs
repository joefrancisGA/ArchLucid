namespace ArchLucid.Core.Configuration;

/// <summary>
///     Per-tenant UTC-day token budget for <see cref="ArchLucid.AgentRuntime.Evaluation.AgentOutputLlmSemanticJudge" />
///     and faithfulness judge completions — separate from <see cref="LlmDailyTenantTokenWindowOptions" />.
/// </summary>
public sealed class LlmJudgeDailyTokenBudgetOptions
{
    /// <summary>Canonical path under <see cref="AgentOutputLlmSemanticJudgeOptions.SectionPath" />.</summary>
    public const string SectionPath = "ArchLucid:Agents:LlmJudge:Budget";

    /// <summary>Legacy assessment path; bound after canonical so <see cref="SectionPath" /> wins.</summary>
    public const string LegacySectionPath = "ArchLucid:AgentExecution:QualityGate:Judge";

    /// <summary>When false, judge completions are not capped by this pool (run-execution daily cap may still apply).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Hard stop: maximum combined prompt + completion tokens per tenant per UTC day for judge calls.</summary>
    public long HardCutoffTokensPerUtcDay
    {
        get;
        set;
    } = 200_000;

    /// <summary>Upper bound assumed per in-flight judge request for pre-call reserve checks.</summary>
    public int AssumedMaxTotalTokensPerRequest
    {
        get;
        set;
    } = 8192;
}
