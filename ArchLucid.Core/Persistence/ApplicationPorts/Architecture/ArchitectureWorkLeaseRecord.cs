namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

/// <summary>Row from <c>dbo.ArchitectureWorkLeases</c> (ADR 0090 / LW-089).</summary>
public sealed class ArchitectureWorkLeaseRecord
{
    public Guid DraftId
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

    public Guid ArchitectureId
    {
        get;
        init;
    }

    public Guid HolderUserId
    {
        get;
        init;
    }

    public DateTimeOffset AcquiredUtc
    {
        get;
        init;
    }

    public DateTimeOffset LastHeartbeatUtc
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresUtc
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
