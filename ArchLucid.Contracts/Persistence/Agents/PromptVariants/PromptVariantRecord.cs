namespace ArchLucid.Contracts.Persistence.Agents.PromptVariants;

/// <summary>Row from <c>dbo.PromptVariants</c> used for weighted A/B selection.</summary>
public sealed class PromptVariantRecord
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

    public int WeightBps
    {
        get;
        init;
    }

    /// <summary>When null or empty, the built-in template text is used.</summary>
    public string? PromptBody
    {
        get;
        init;
    }
}
