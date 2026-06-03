namespace ArchLucid.Core.Configuration;

/// <summary>Feature flag for AI-assisted executive run summary export (TB-186).</summary>
public sealed class GenerateRunSummaryOptions
{
    public const string SectionPath = "AgentRuntime:GenerateRunSummary";

    public bool Enabled
    {
        get;
        set;
    } = false;
}
