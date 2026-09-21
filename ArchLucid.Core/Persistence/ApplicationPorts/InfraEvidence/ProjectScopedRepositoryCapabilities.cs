using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IProjectScopedOperationalSecurityFindingRepository
{
    Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyInScopeAsync(
        ProjectScopeKey scope,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityFindingRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task UpdateInScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingMutation mutation,
        IReadOnlyList<OperationalSecurityFindingMetadataMutation> metadata,
        OperationalSecurityFindingObservationMutation? observation,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedRemediationInstanceRepository
{
    Task UpdateInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceInScopeAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedInScopeAsync(
        ProjectScopeKey scope,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedAuditAssessmentRepository
{
    Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentCreateMutation mutation,
        CancellationToken cancellationToken = default);

    Task<AuditAssessmentRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task UpdateStatusInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentStatusMutation mutation,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedAuditEvidenceSnapshotRepository
{
    Task InsertSnapshotInScopeAsync(
        ProjectScopeKey scope,
        AuditEvidenceSnapshotPersistRequest request,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task InsertBaselineInScopeAsync(
        ProjectScopeKey scope,
        AuditEvidenceBaselineRecord baseline,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default);

    Task UpdateItemFreshnessInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
        CancellationToken cancellationToken = default);
}
