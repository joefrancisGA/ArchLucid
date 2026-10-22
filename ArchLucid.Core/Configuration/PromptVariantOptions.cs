namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional A/B routing for built-in agent system prompts via weighted variants in <c>dbo.PromptVariants</c>.
/// </summary>
public sealed class PromptVariantOptions
{
    /// <summary>Configuration section: <c>AgentRuntime:PromptVariants</c>.</summary>
    public const string SectionPath = "AgentRuntime:PromptVariants";

    /// <summary>
    ///     When false (default), <see cref="AgentRuntime.Prompts.IAgentSystemPromptCatalog" /> uses in-code templates only.
    /// </summary>
    public bool Enabled
    {
        get;
        set;
    }
}
