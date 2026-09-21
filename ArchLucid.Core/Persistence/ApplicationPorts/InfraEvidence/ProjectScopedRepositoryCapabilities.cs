using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IProjectScopedOperationalSecurityFindingRepository
{
    Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
        ProjectScopeKey scope,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingMutation mutation,
        IReadOnlyList<OperationalSecurityFindingMetadataMutation> metadata,
        OperationalSecurityFindingObservationMutation? observation,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedRemediationInstanceRepository
{
    Task UpdateAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceRecord?> TryGetByIdAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        ProjectScopeKey scope,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedAuditAssessmentRepository
{
    Task InsertAsync(
        ProjectScopeKey scope,
        AuditAssessmentCreateMutation mutation,
        CancellationToken cancellationToken = default);

    Task<AuditAssessmentRecord?> TryGetByIdAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task UpdateStatusAsync(
        ProjectScopeKey scope,
        AuditAssessmentStatusMutation mutation,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default);
}

public interface IProjectScopedAuditEvidenceSnapshotRepository
{
    Task InsertSnapshotAsync(
        ProjectScopeKey scope,
        AuditEvidenceSnapshotPersistRequest request,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task InsertBaselineAsync(
        ProjectScopeKey scope,
        AuditEvidenceBaselineRecord baseline,
        CancellationToken cancellationToken = default);

    Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default);

    Task UpdateItemFreshnessAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates,
        CancellationToken cancellationToken = default);
}
