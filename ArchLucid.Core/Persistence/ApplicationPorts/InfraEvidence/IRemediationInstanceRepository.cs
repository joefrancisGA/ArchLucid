using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceRepository
{
    Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    async Task UpdateInstanceInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceMutation mutation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mutation);

        RemediationInstanceRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.InstanceId, cancellationToken);

        if (current is null)
            return;

        await UpdateInstanceAsync(mutation.ApplyTo(current), cancellationToken);
    }

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

    async Task<IReadOnlyList<RemediationInstanceRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RemediationInstanceRecord> rows =
            await ListByTenantAsync(scope.TenantId, cancellationToken);

        return rows
            .Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
            .ToList();
    }

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

    public RemediationInstanceRecord ApplyTo(RemediationInstanceRecord source)
    {
        ArgumentNullException.ThrowIfNull(source);

        if (source.InstanceId != InstanceId)
            throw new InvalidOperationException("Remediation mutation id does not match the source record.");

        return new RemediationInstanceRecord
        {
            InstanceId = source.InstanceId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            FindingId = source.FindingId,
            PatternId = source.PatternId,
            PatternVersionId = source.PatternVersionId,
            PatternKey = source.PatternKey,
            FrozenPatternVersion = source.FrozenPatternVersion,
            AutomationLevel = source.AutomationLevel,
            Status = Status,
            CloudResourceId = CloudResourceId,
            PathId = PathId,
            PathNarrativeJson = PathNarrativeJson,
            AssessmentId = AssessmentId,
            ControlId = ControlId,
            PreflightSnapshotId = PreflightSnapshotId,
            ExecutionSnapshotId = ExecutionSnapshotId,
            VerificationSnapshotId = VerificationSnapshotId,
            WaveId = WaveId,
            PreflightResultJson = PreflightResultJson,
            VerificationResultJson = VerificationResultJson,
            CreatedByActorKey = source.CreatedByActorKey,
            ApprovedByActorKey = ApprovedByActorKey,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = UpdatedUtc,
            ApprovedUtc = ApprovedUtc,
            ExecutedUtc = ExecutedUtc,
            VerifiedUtc = VerifiedUtc,
            ClosedUtc = ClosedUtc,
        };
    }
}
