using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceSnapshotVerificationService
{
    Task<AuditEvidenceSnapshotVerificationResult> TryVerifyAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);
}

public sealed class AuditEvidenceSnapshotVerificationResult
{
    public bool IsValid
    {
        get;
        init;
    }

    public string? FailureReason
    {
        get;
        init;
    }
}
