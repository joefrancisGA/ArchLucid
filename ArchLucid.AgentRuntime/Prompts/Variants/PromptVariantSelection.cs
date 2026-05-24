namespace ArchLucid.AgentRuntime.Prompts.Variants;

/// <summary>Outcome of weighted variant selection for one agent invocation.</summary>
public sealed class PromptVariantSelection
{
    public required string PromptTemplateName
    {
        get;
        init;
    }

    public required string VariantKey
    {
        get;
        init;
    }

    /// <summary>Resolved system prompt text (variant body or built-in fallback).</summary>
    public required string PromptBody
    {
        get;
        init;
    }
}
