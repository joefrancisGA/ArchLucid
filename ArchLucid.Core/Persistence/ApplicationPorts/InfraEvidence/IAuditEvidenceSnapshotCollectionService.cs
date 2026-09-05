using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceSnapshotCollectionService
{
    Task<AuditAssessmentCreateResult> TryCreateAssessmentAsync(
        ScopeContext scope,
        Guid frameworkId,
        string requestedBy,
        IReadOnlyList<string> subscriptionIds,
        DateTime? periodStartUtc,
        DateTime? periodEndUtc,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotCollectionResult> TryCollectSnapshotAsync(
        ScopeContext scope,
        Guid assessmentId,
        IReadOnlyList<Guid> inventorySnapshotIds,
        CancellationToken cancellationToken = default);
}

public sealed class AuditAssessmentCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? AssessmentId
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

public sealed class AuditEvidenceSnapshotCollectionResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public byte[]? EvidenceHashSha256
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
