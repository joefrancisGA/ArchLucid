namespace ArchLucid.Core.Configuration;

/// <summary>Feature flag for LLM explanations on pre-commit governance 409 responses.</summary>
public sealed class ExplainGovernanceBlocksOptions
{
    public const string SectionPath = "AgentRuntime:ExplainGovernanceBlocks";

    public bool Enabled
    {
        get;
        set;
    } = false;
}
