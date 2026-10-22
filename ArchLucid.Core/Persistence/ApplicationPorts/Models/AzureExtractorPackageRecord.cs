namespace ArchLucid.Persistence.Models;

public sealed class AzureExtractorPackageRecord
{
    public Guid PackageId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public int SchemaVersion
    {
        get;
        init;
    }

    public string? ScriptVersion
    {
        get;
        init;
    }

    public DateTime? CollectionTimestampUtc
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public string OriginalFileName
    {
        get;
        init;
    } = string.Empty;

    public string ManifestJson
    {
        get;
        init;
    } = string.Empty;

    public byte[] PackageBytes
    {
        get;
        init;
    } = [];
}
