namespace ArchLucid.Persistence.InfraEvidence;

public sealed class OperationalSecurityFindingMetadataRecord
{
    public Guid MetadataRowId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string MetadataKey
    {
        get;
        init;
    } = string.Empty;

    public string? MetadataValue
    {
        get;
        init;
    }
}
