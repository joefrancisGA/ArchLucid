using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceSelectionService
{
    Task<AuditEvidenceSelectionResult?> TrySelectForFrameworkAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid frameworkId,
        CancellationToken cancellationToken = default);
}
