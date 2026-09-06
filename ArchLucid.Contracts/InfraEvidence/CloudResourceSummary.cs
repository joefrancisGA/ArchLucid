namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceSummary
{
    public Guid CloudResourceId
    {
        get;
        set;
    }

    public string ExternalResourceId
    {
        get;
        set;
    } = string.Empty;

    public string? DisplayName
    {
        get;
        set;
    }

    public string? ResourceType
    {
        get;
        set;
    }

    public string? ResourceGroup
    {
        get;
        set;
    }

    public string? Region
    {
        get;
        set;
    }

    public DateTime LastSeenUtc
    {
        get;
        set;
    }
}
