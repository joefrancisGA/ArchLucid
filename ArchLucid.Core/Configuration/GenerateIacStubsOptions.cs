namespace ArchLucid.Core.Configuration;

/// <summary>Feature flag for post-commit finding-to-IaC stub generation.</summary>
public sealed class GenerateIacStubsOptions
{
    public const string SectionPath = "AgentRuntime:GenerateIacStubs";

    public bool Enabled
    {
        get;
        set;
    } = false;
}
