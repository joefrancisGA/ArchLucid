namespace ArchLucid.Persistence.InfraEvidence;

using ArchLucid.Core.Scoping;

public interface IAuditEvidencePackageExportService
{
    Task<AuditEvidencePackageExportResult> TryExportAsync(
        ScopeContext scope,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);
}
