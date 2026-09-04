namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceSnapshotPersistRequest
{
    public AuditEvidenceSnapshotHeaderRecord Header
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AuditEvidenceSnapshotItemRecord> Items
    {
        get;
        init;
    } = [];
}

public interface IAuditEvidenceSnapshotRepository
{
    Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default);

    Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
        Guid tenantId,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default);
}
