using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceRepository
{
    Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task UpdateInstanceInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    async Task<RemediationInstanceRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? record =
            await TryGetByIdAsync(scope.TenantId, instanceId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);
}

public sealed record RemediationInstanceMutation
{
    public required Guid InstanceId { get; init; }
    public required RemediationInstanceStatus Status { get; init; }
    public Guid? CloudResourceId { get; init; }
    public Guid? PathId { get; init; }
    public string? PathNarrativeJson { get; init; }
    public Guid? AssessmentId { get; init; }
    public Guid? ControlId { get; init; }
    public Guid? PreflightSnapshotId { get; init; }
    public Guid? ExecutionSnapshotId { get; init; }
    public Guid? VerificationSnapshotId { get; init; }
    public Guid? WaveId { get; init; }
    public string? PreflightResultJson { get; init; }
    public string? VerificationResultJson { get; init; }
    public string? ApprovedByActorKey { get; init; }
    public required DateTime UpdatedUtc { get; init; }
    public DateTime? ApprovedUtc { get; init; }
    public DateTime? ExecutedUtc { get; init; }
    public DateTime? VerifiedUtc { get; init; }
    public DateTime? ClosedUtc { get; init; }
}
