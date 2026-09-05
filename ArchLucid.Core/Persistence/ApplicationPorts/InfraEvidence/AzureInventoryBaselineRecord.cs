using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryBaselineRecord
{
    public Guid BaselineId
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

    public Guid SnapshotId
    {
        get;
        init;
    }

    public AzureInventoryBaselineKind BaselineKind
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public string DesignatedBy
    {
        get;
        init;
    } = string.Empty;

    public DateTime DesignatedUtc
    {
        get;
        init;
    }

    public string? Notes
    {
        get;
        init;
    }
}
