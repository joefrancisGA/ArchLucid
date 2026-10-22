using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceSnapshotQueryService
{
    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListSnapshotsAsync(
        ScopeContext scope,
        Guid assessmentId,
        AuditEvidenceReadMode readMode,
        string? baselineName,
        CancellationToken cancellationToken = default);
}
