using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceFreshnessService
{
    Task<IReadOnlyList<AuditEvidenceFreshnessItemUpdate>> ClassifySnapshotItemsAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceFreshnessItemUpdate>> ClassifySnapshotItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default);

    Task ApplyFreshnessToSnapshotAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default);

    Task ApplyFreshnessToSnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceFreshnessDashboardRecord> GetDashboardCountsAsync(
        ScopeContext scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceFreshnessDashboardRecord> GetDashboardCountsInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListHistoricalItemsAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListHistoricalItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);
}
