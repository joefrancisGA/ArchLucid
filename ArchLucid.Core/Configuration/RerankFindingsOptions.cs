namespace ArchLucid.Core.Configuration;

/// <summary>Feature flag for post-commit LLM priority re-ranking of relational finding records.</summary>
public sealed class RerankFindingsOptions
{
    public const string SectionPath = "AgentRuntime:RerankFindings";

    public bool Enabled
    {
        get;
        set;
    } = false;
}
