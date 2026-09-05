namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidencePackageExportService
{
    Task<AuditEvidencePackageExportResult> TryExportAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);
}
