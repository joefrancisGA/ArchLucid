using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class ProjectScopedOperationalSecurityFindingRepositoryAdapter(
    IOperationalSecurityFindingRepository inner) : IProjectScopedOperationalSecurityFindingRepository
{
    public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(ProjectScopeKey scope, CloudProvider provider, string sourceSystem, string sourceFindingId, CancellationToken cancellationToken = default) =>
        inner.TryGetByNaturalKeyInScopeAsync(scope, provider, sourceSystem, sourceFindingId, cancellationToken);

    public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, findingId, cancellationToken);

    public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListAsync(ProjectScopeKey scope, OperationalSecurityFindingStatus? status, CancellationToken cancellationToken = default) =>
        inner.ListByScopeAsync(scope, status, cancellationToken);

    public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.ListMetadataByFindingInScopeAsync(scope, findingId, cancellationToken);

    public Task UpdateAsync(ProjectScopeKey scope, OperationalSecurityFindingMutation mutation, IReadOnlyList<OperationalSecurityFindingMetadataMutation> metadata, OperationalSecurityFindingObservationMutation? observation, CancellationToken cancellationToken = default) =>
        inner.UpdateInScopeAsync(scope, mutation, metadata, observation, cancellationToken);
}

public sealed class ProjectScopedRemediationInstanceRepositoryAdapter(
    IRemediationInstanceRepository inner) : IProjectScopedRemediationInstanceRepository
{
    public Task UpdateAsync(ProjectScopeKey scope, RemediationInstanceMutation mutation, CancellationToken cancellationToken = default) =>
        inner.UpdateInstanceInScopeAsync(scope, mutation, cancellationToken);

    public Task<RemediationInstanceRecord?> TryGetByIdAsync(ProjectScopeKey scope, Guid instanceId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, instanceId, cancellationToken);

    public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(ProjectScopeKey scope, Guid instanceId, CancellationToken cancellationToken = default) =>
        inner.ListEvidenceByInstanceInScopeAsync(scope, instanceId, cancellationToken);

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListAsync(ProjectScopeKey scope, CancellationToken cancellationToken = default) =>
        inner.ListByScopeAsync(scope, cancellationToken);

    public Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(ProjectScopeKey scope, Guid cloudResourceId, int page, int pageSize, CancellationToken cancellationToken = default) =>
        inner.ListByCloudResourceIdPagedInScopeAsync(scope, cloudResourceId, page, pageSize, cancellationToken);

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.ListByFindingIdInScopeAsync(scope, findingId, cancellationToken);
}

public sealed class ProjectScopedAuditAssessmentRepositoryAdapter(
    IAuditAssessmentRepository inner) : IProjectScopedAuditAssessmentRepository
{
    public Task InsertAsync(ProjectScopeKey scope, AuditAssessmentCreateMutation mutation, CancellationToken cancellationToken = default) =>
        inner.InsertInScopeAsync(scope, mutation, cancellationToken);

    public Task<AuditAssessmentRecord?> TryGetByIdAsync(ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, assessmentId, cancellationToken);

    public Task UpdateStatusAsync(ProjectScopeKey scope, AuditAssessmentStatusMutation mutation, CancellationToken cancellationToken = default) =>
        inner.UpdateStatusInScopeAsync(scope, mutation, cancellationToken);

    public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveAsync(ProjectScopeKey scope, CancellationToken cancellationToken = default) =>
        inner.ListActiveByScopeAsync(scope, cancellationToken);
}

public sealed class ProjectScopedAuditEvidenceSnapshotRepositoryAdapter(
    IAuditEvidenceSnapshotRepository inner) : IProjectScopedAuditEvidenceSnapshotRepository
{
    public Task InsertSnapshotAsync(ProjectScopeKey scope, AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default) =>
        inner.InsertSnapshotInScopeAsync(scope, request, cancellationToken);

    public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, CancellationToken cancellationToken = default) =>
        inner.TryGetHeaderInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, CancellationToken cancellationToken = default) =>
        inner.ListItemsInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default) =>
        inner.ListByAssessmentInScopeAsync(scope, assessmentId, cancellationToken);

    public Task InsertBaselineAsync(ProjectScopeKey scope, AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default) =>
        inner.InsertBaselineInScopeAsync(scope, baseline, cancellationToken);

    public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(ProjectScopeKey scope, Guid assessmentId, string baselineName, CancellationToken cancellationToken = default) =>
        inner.TryGetBaselineByNameInScopeAsync(scope, assessmentId, baselineName, cancellationToken);

    public Task UpdateItemFreshnessAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates, CancellationToken cancellationToken = default) =>
        inner.UpdateItemFreshnessInScopeAsync(scope, auditEvidenceSnapshotId, updates, cancellationToken);
}
