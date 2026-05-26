namespace ArchLucid.Core.Configuration;

/// <summary>LLM-assisted inference for incomplete Azure extractor inventory rows.</summary>
public sealed class AzureExtractorEnrichmentOptions
{
    public const string SectionPath = "AgentRuntime:AzureExtractorEnrichment";

    /// <summary>When false, inventory rows pass through unchanged (default).</summary>
    public bool Enabled
    {
        get;
        set;
    }
}
