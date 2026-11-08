using ArchLucid.Core.Scoping;

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

    Task InsertSnapshotInScopeAsync(
        ProjectScopeKey scope,
        AuditEvidenceSnapshotPersistRequest request,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default);

    Task InsertBaselineInScopeAsync(
        ProjectScopeKey scope,
        AuditEvidenceBaselineRecord baseline,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
        Guid tenantId,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task UpdateItemFreshnessAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
        CancellationToken cancellationToken = default);

    Task UpdateItemFreshnessInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("A project-scoped audit repository implementation is required.");

    Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int take,
        CancellationToken cancellationToken = default);
}
