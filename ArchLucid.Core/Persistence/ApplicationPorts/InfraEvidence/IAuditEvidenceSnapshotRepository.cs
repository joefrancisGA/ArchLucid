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
        InsertSnapshotAsync(request, cancellationToken);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetHeaderAsync(scope.TenantId, auditEvidenceSnapshotId, cancellationToken);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        ListItemsAsync(scope.TenantId, auditEvidenceSnapshotId, cancellationToken);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default) =>
        ListByAssessmentAsync(scope.TenantId, assessmentId, cancellationToken);

    Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default);

    Task InsertBaselineInScopeAsync(
        ProjectScopeKey scope,
        AuditEvidenceBaselineRecord baseline,
        CancellationToken cancellationToken = default) =>
        InsertBaselineAsync(baseline, cancellationToken);

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
        TryGetBaselineByNameAsync(scope.TenantId, assessmentId, baselineName, cancellationToken);

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
        UpdateItemFreshnessAsync(scope.TenantId, auditEvidenceSnapshotId, updates, cancellationToken);

    Task<IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord>> ListLineageContextsByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int take,
        CancellationToken cancellationToken = default);
}
