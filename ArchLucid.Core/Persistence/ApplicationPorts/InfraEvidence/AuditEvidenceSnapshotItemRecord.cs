using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceSnapshotItemRecord
{
    public Guid EvidenceRowId
    {
        get;
        init;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public Guid RequirementId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? AzureResourceId
    {
        get;
        init;
    }

    public string EvidenceType
    {
        get;
        init;
    } = string.Empty;

    public DateTime CollectedUtc
    {
        get;
        init;
    }

    public string CollectorVersion
    {
        get;
        init;
    } = string.Empty;

    public string? NormalizedPointer
    {
        get;
        init;
    }

    public string? RawPointer
    {
        get;
        init;
    }

    public byte[] EvidenceHashSha256
    {
        get;
        init;
    } = [];

    public AuditEvidenceCollectionStatus CollectionStatus
    {
        get;
        init;
    }

    public AuditEvidenceFreshnessStatus FreshnessStatus
    {
        get;
        init;
    }

    public decimal Confidence
    {
        get;
        init;
    }

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string SelectorVersion
    {
        get;
        init;
    } = string.Empty;

    public string? AzureScope
    {
        get;
        init;
    }

    public string? ApiQueryId
    {
        get;
        init;
    }
}
