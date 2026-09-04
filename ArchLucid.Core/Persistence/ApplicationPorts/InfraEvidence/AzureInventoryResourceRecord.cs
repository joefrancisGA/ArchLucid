namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryResourceRecord
{
    public Guid ResourceRowId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

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

    public string? Region
    {
        get;
        init;
    }

    public string? ResourceGroup
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public string? ParentResourceId
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
