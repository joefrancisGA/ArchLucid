namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditManualEvidenceSubmitRequest
{
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

    public string DocumentKind
    {
        get;
        init;
    } = string.Empty;

    public string Content
    {
        get;
        init;
    } = string.Empty;

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

public sealed class AuditManualEvidenceSubmitResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? SubmissionId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public interface IAuditManualEvidenceSubmissionService
{
    Task<AuditManualEvidenceSubmitResult> TrySubmitAsync(
        AuditManualEvidenceSubmitRequest request,
        CancellationToken cancellationToken = default);
}

public interface IAuditHybridEvidenceQueryService
{
    Task<AuditHybridControlEvidenceRecord?> TryGetControlEvidenceSourcesAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);
}
