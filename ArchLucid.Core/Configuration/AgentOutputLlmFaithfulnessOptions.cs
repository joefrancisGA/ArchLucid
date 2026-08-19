using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional LLM faithfulness judge comparing persisted agent JSON against the run evidence package.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class AgentOutputLlmFaithfulnessOptions
{
    public const string SectionPath = "ArchLucid:Agents:LlmFaithfulness";

    /// <summary>When false, faithfulness LLM calls are skipped. Defaults to <c>false</c> (opt-in).</summary>
    public bool Enabled
    {
        get;
        set;
    } = false;

    /// <summary>Hard cap on evidence text sent to the judge (tail truncated).</summary>
    public int MaxEvidenceCharacters
    {
        get;
        set;
    } = 48_000;

    /// <summary>Hard cap on characters of <c>ParsedResultJson</c> sent to the judge.</summary>
    public int MaxInputCharacters
    {
        get;
        set;
    } = 56_000;

    public int TimeoutSeconds
    {
        get;
        set;
    } = 25;

    /// <summary>When true and <c>AgentExecution:Mode</c> is Simulator, the judge is skipped.</summary>
    public bool SkipWhenSimulator
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     When true (TB-021 Phase B promotion), per-trace gate outcomes may warn or reject when
    ///     <see cref="ArchLucid.Contracts.Agents.AgentOutputSemanticScore.LlmFaithfulnessScore" /> falls below configured floors.
    ///     Requires <see cref="Enabled" /> and a scored trace; other traces on the run continue independently.
    /// </summary>
    public bool EnforcePhaseB
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     Per-trace reject floor for Phase B enforcement when <see cref="EnforcePhaseB" /> is true.
    ///     Aligns with nightly golden-cohort p50 floor (default 0.65; ratchet target 0.70).
    /// </summary>
    public double MinScoreRejectBelow
    {
        get;
        set;
    } = 0.65;

    /// <summary>
    ///     Optional per-trace warn ceiling: when set above <see cref="MinScoreRejectBelow" />, scores in
    ///     [<see cref="MinScoreRejectBelow" />, <c>MinScoreWarnBelow</c>) warn without rejecting.
    ///     Null disables warn-only Phase B classification (reject floor still applies).
    /// </summary>
    public double? MinScoreWarnBelow
    {
        get;
        set;
    } = 0.70;
}
