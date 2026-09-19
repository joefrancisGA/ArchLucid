using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityDeclaredConnectionRecord
{
    public Guid ConnectionId
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

    public Guid FromCloudResourceId
    {
        get;
        init;
    }

    public Guid ToCloudResourceId
    {
        get;
        init;
    }

    public SecurityDeclaredConnectionRelationshipType RelationshipType
    {
        get;
        init;
    }

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? EvidenceReference
    {
        get;
        init;
    }

    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public SecurityDeclaredConnectionStatus Status
    {
        get;
        init;
    }

    public string RequestedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string ApprovedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public byte[] PayloadHashSha256
    {
        get;
        init;
    } = [];

    public DateTime? ExpiryProcessedUtc
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

    public DateTime? RevokedUtc
    {
        get;
        init;
    }

    public string? RevokedByActorKey
    {
        get;
        init;
    }
}
