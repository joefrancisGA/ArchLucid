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
}
