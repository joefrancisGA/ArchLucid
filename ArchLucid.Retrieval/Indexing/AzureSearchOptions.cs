namespace ArchLucid.Retrieval.Indexing;

/// <summary>Configuration for <see cref="AzureSearchSdkClient" /> under <c>Retrieval:AzureSearch</c>.</summary>
public sealed class AzureSearchOptions
{
    public const string SectionPath = "Retrieval:AzureSearch";

    public string? Endpoint
    {
        get;
        set;
    }

    public string? IndexName
    {
        get;
        set;
    }

    public string? ApiKey
    {
        get;
        set;
    }
}
