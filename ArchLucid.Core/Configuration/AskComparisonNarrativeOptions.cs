namespace ArchLucid.Core.Configuration;

/// <summary>Optional LLM comparison narrative on <c>POST /v1/ask</c> when base and target runs are set (TB-224).</summary>
public sealed class AskComparisonNarrativeOptions
{
    public const string SectionPath = "Ask";

    /// <summary>When true, <see cref="Host.Core.Services.Ask.AskService" /> may call the LLM for <c>ComparisonNarrative</c>.</summary>
    public bool GenerateComparisonNarrative
    {
        get;
        set;
    }
}
