using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceLineageService
{
    Task<AuditEvidenceLineageQueryResult> TryGetControlLineageAsync(
        ScopeContext scope,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        Guid controlId,
        CancellationToken cancellationToken = default);
}
