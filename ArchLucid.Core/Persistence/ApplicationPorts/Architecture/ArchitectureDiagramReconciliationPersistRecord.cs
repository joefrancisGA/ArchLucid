namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureDiagramReconciliationPersistRecord
{
    public Guid ReconciliationId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string ResultJson
    {
        get;
        init;
    } = string.Empty;

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
