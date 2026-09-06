using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
{
    public Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(null);

    public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>([]);

    public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>>([]);

    public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
        Guid tenantId,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditEvidenceBaselineRecord?>(null);

    public Task UpdateItemFreshnessAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int take,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>>([]);
}
