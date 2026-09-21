using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class ProjectScopedOperationalSecurityFindingRepositoryAdapter(
    IOperationalSecurityFindingRepository inner) : IProjectScopedOperationalSecurityFindingRepository
{
    public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyInScopeAsync(ProjectScopeKey scope, CloudProvider provider, string sourceSystem, string sourceFindingId, CancellationToken cancellationToken = default) =>
        inner.TryGetByNaturalKeyInScopeAsync(scope, provider, sourceSystem, sourceFindingId, cancellationToken);

    public Task<OperationalSecurityFindingRecord?> TryGetByIdInScopeAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, findingId, cancellationToken);

    public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByScopeAsync(ProjectScopeKey scope, OperationalSecurityFindingStatus? status, CancellationToken cancellationToken = default) =>
        inner.ListByScopeAsync(scope, status, cancellationToken);

    public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingInScopeAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.ListMetadataByFindingInScopeAsync(scope, findingId, cancellationToken);

    public Task UpdateInScopeAsync(ProjectScopeKey scope, OperationalSecurityFindingMutation mutation, IReadOnlyList<OperationalSecurityFindingMetadataMutation> metadata, OperationalSecurityFindingObservationMutation? observation, CancellationToken cancellationToken = default) =>
        inner.UpdateInScopeAsync(scope, mutation, metadata, observation, cancellationToken);
}

public sealed class ProjectScopedRemediationInstanceRepositoryAdapter(
    IRemediationInstanceRepository inner) : IProjectScopedRemediationInstanceRepository
{
    public Task UpdateInScopeAsync(ProjectScopeKey scope, RemediationInstanceMutation mutation, CancellationToken cancellationToken = default) =>
        inner.UpdateInstanceInScopeAsync(scope, mutation, cancellationToken);

    public Task<RemediationInstanceRecord?> TryGetByIdInScopeAsync(ProjectScopeKey scope, Guid instanceId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, instanceId, cancellationToken);

    public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceInScopeAsync(ProjectScopeKey scope, Guid instanceId, CancellationToken cancellationToken = default) =>
        inner.ListEvidenceByInstanceInScopeAsync(scope, instanceId, cancellationToken);

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListByScopeAsync(ProjectScopeKey scope, CancellationToken cancellationToken = default) =>
        inner.ListByScopeAsync(scope, cancellationToken);

    public Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedInScopeAsync(ProjectScopeKey scope, Guid cloudResourceId, int page, int pageSize, CancellationToken cancellationToken = default) =>
        inner.ListByCloudResourceIdPagedInScopeAsync(scope, cloudResourceId, page, pageSize, cancellationToken);

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdInScopeAsync(ProjectScopeKey scope, Guid findingId, CancellationToken cancellationToken = default) =>
        inner.ListByFindingIdInScopeAsync(scope, findingId, cancellationToken);
}

public sealed class ProjectScopedAuditAssessmentRepositoryAdapter(
    IAuditAssessmentRepository inner) : IProjectScopedAuditAssessmentRepository
{
    public Task InsertInScopeAsync(ProjectScopeKey scope, AuditAssessmentCreateMutation mutation, CancellationToken cancellationToken = default) =>
        inner.InsertInScopeAsync(scope, mutation, cancellationToken);

    public Task<AuditAssessmentRecord?> TryGetByIdInScopeAsync(ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default) =>
        inner.TryGetByIdInScopeAsync(scope, assessmentId, cancellationToken);

    public Task UpdateStatusInScopeAsync(ProjectScopeKey scope, AuditAssessmentStatusMutation mutation, CancellationToken cancellationToken = default) =>
        inner.UpdateStatusInScopeAsync(scope, mutation, cancellationToken);

    public Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByScopeAsync(ProjectScopeKey scope, CancellationToken cancellationToken = default) =>
        inner.ListActiveByScopeAsync(scope, cancellationToken);
}

public sealed class ProjectScopedAuditEvidenceSnapshotRepositoryAdapter(
    IAuditEvidenceSnapshotRepository inner) : IProjectScopedAuditEvidenceSnapshotRepository
{
    public Task InsertSnapshotInScopeAsync(ProjectScopeKey scope, AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default) =>
        inner.InsertSnapshotInScopeAsync(scope, request, cancellationToken);

    public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderInScopeAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, CancellationToken cancellationToken = default) =>
        inner.TryGetHeaderInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsInScopeAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, CancellationToken cancellationToken = default) =>
        inner.ListItemsInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentInScopeAsync(ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default) =>
        inner.ListByAssessmentInScopeAsync(scope, assessmentId, cancellationToken);

    public Task InsertBaselineInScopeAsync(ProjectScopeKey scope, AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default) =>
        inner.InsertBaselineInScopeAsync(scope, baseline, cancellationToken);

    public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameInScopeAsync(ProjectScopeKey scope, Guid assessmentId, string baselineName, CancellationToken cancellationToken = default) =>
        inner.TryGetBaselineByNameInScopeAsync(scope, assessmentId, baselineName, cancellationToken);

    public Task UpdateItemFreshnessInScopeAsync(ProjectScopeKey scope, Guid auditEvidenceSnapshotId, IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates, CancellationToken cancellationToken = default) =>
        inner.UpdateItemFreshnessInScopeAsync(scope, auditEvidenceSnapshotId, updates, cancellationToken);
}
