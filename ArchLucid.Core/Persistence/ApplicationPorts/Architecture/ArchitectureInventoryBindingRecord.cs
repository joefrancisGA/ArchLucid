namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureInventoryBindingRecord
{
    public Guid ArchitectureId
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

    public Guid ScopeProjectId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string BoundBy
    {
        get;
        init;
    } = string.Empty;

    public DateTime BoundUtc
    {
        get;
        init;
    }

    public byte[]? RowVersion
    {
        get;
        init;
    }
}
