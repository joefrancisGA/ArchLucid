using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditManualEvidenceSubmissionRecord
{
    public Guid SubmissionId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public Guid RequirementId
    {
        get;
        init;
    }

    public string Owner
    {
        get;
        init;
    } = string.Empty;

    public string SubmittedBy
    {
        get;
        init;
    } = string.Empty;

    public DateTime SubmittedUtc
    {
        get;
        init;
    }

    public DateTime? ApplicablePeriodStartUtc
    {
        get;
        init;
    }

    public DateTime? ApplicablePeriodEndUtc
    {
        get;
        init;
    }

    public DateTime? ExpirationUtc
    {
        get;
        init;
    }

    public string? DocumentVersion
    {
        get;
        init;
    }

    public string DocumentKind
    {
        get;
        init;
    } = string.Empty;

    public byte[] EvidenceHashSha256
    {
        get;
        init;
    } = [];

    public string BlobPointer
    {
        get;
        init;
    } = string.Empty;

    public AuditEvidenceReviewStatus ReviewStatus
    {
        get;
        init;
    }

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string? ItsmProvider
    {
        get;
        init;
    }

    public string? ItsmExternalKey
    {
        get;
        init;
    }
}
