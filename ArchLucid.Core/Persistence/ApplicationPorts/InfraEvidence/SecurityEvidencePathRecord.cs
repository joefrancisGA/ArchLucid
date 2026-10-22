using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathRecord
{
    public Guid PathId
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

    public PathKind PathKind
    {
        get;
        init;
    }

    public PathConfidenceBand PathConfidenceBand
    {
        get;
        init;
    }

    public byte[] CanonicalHopHashSha256
    {
        get;
        init;
    } = [];

    public int WeakestHopOrdinal
    {
        get;
        init;
    }

    public string WeakestHopReason
    {
        get;
        init;
    } = string.Empty;

    public Guid? CrownJewelAssertionId
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
