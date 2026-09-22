namespace ArchLucid.Contracts.Governance;

/// <summary>One blocking dimension on the unified finalize-readiness contract.</summary>
public sealed class FinalizeReadinessBlock
{
    public string Code
    {
        get;
        init;
    } = null!;

    public string Message
    {
        get;
        init;
    } = null!;

    /// <summary>Gate layer: career-artifact, integrity, scorecard, or governance.</summary>
    public string Layer
    {
        get;
        init;
    } = null!;

    /// <summary>Optional TB-184 LLM explanation when <see cref="AgentRuntime:ExplainGovernanceBlocks:Enabled"/> is true.</summary>
    public string? BlockExplanation
    {
        get;
        init;
    }
}
