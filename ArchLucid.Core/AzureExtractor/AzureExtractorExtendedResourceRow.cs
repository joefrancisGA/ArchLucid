namespace ArchLucid.Core.AzureExtractor;

/// <summary>Extended ARM inventory row from schema v2 <c>resources.json</c> entries.</summary>
public sealed class AzureExtractorExtendedResourceRow
{
    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ResourceType
    {
        get;
        init;
    } = string.Empty;

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? Location
    {
        get;
        init;
    }

    public string? ResourceGroup
    {
        get;
        init;
    }

    public string? SkuName
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string> Tags
    {
        get;
        init;
    } = new Dictionary<string, string>();

    public IReadOnlyDictionary<string, string> Properties
    {
        get;
        init;
    } = new Dictionary<string, string>();

    public bool IsUnknownType
    {
        get;
        init;
    }
}
