namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class InfrastructureDiagramNodeMappingPersistRecord
{
    public Guid MappingId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string NormalizedDiagramLabel
    {
        get;
        init;
    } = string.Empty;

    public string? DiagramNodeId
    {
        get;
        init;
    }

    public Guid CloudResourceId
    {
        get;
        init;
    }

    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string? SavedByUserOid
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
