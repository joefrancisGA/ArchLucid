using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class CloudResourceIdentityRecord
{
    public Guid CloudResourceId
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

    public CloudProvider Provider
    {
        get;
        init;
    }

    public string ExternalResourceIdNormalized
    {
        get;
        init;
    } = string.Empty;

    public string? ResourceType
    {
        get;
        init;
    }

    public string? SubscriptionOrAccountId
    {
        get;
        init;
    }

    public string? ResourceGroupOrProject
    {
        get;
        init;
    }

    public string? Region
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public Guid? FirstSeenSnapshotId
    {
        get;
        init;
    }

    public Guid? LastSeenSnapshotId
    {
        get;
        init;
    }

    public DateTime FirstSeenUtc
    {
        get;
        init;
    }

    public DateTime LastSeenUtc
    {
        get;
        init;
    }
}
