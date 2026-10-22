namespace ArchLucid.Contracts.AzureExtractor;

/// <summary>
///     ARM inventory row after optional LLM enrichment of missing type, location, or tier fields.
/// </summary>
public sealed class EnrichedAzureExtractorInventoryLine
{
    public string Name
    {
        get;
        set;
    } = string.Empty;

    public string? ResourceGroup
    {
        get;
        set;
    }

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public bool ResourceTypeInferred
    {
        get;
        set;
    }

    public string? Location
    {
        get;
        set;
    }

    public bool LocationInferred
    {
        get;
        set;
    }

    public string? Tier
    {
        get;
        set;
    }

    public bool TierInferred
    {
        get;
        set;
    }
}
