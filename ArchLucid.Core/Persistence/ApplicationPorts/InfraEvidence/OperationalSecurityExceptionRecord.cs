using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class OperationalSecurityExceptionRecord
{
    public Guid ExceptionId
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

    public Guid? FindingId
    {
        get;
        init;
    }

    public Guid? PatternId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string OwnerActorKeysJson
    {
        get;
        init;
    } = "[]";

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? ResidualRisk
    {
        get;
        init;
    }

    public string? CompensatingControls
    {
        get;
        init;
    }

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

    public OperationalSecurityExceptionStatus Status
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
