using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceRepository
{
    Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task InsertInstanceInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceRecord instance,
        CancellationToken cancellationToken = default) =>
        InsertInstanceAsync(instance, cancellationToken);

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

    Task InsertEvidenceInScopeAsync(
        ProjectScopeKey scope,
        RemediationEvidenceRecord evidence,
        CancellationToken cancellationToken = default) =>
        InsertEvidenceAsync(evidence, cancellationToken);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceInScopeAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await TryGetByIdInScopeAsync(scope, instanceId, cancellationToken);
        return instance is null
            ? []
            : await ListEvidenceByInstanceAsync(scope.TenantId, instanceId, cancellationToken);
    }

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

    async Task<IReadOnlyDictionary<Guid, RemediationInstanceRecord>> ListLatestApprovedByFindingIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyCollection<Guid> findingIds,
        CancellationToken cancellationToken = default)
    {
        if (findingIds.Count == 0)
        {
            return new Dictionary<Guid, RemediationInstanceRecord>();
        }

        HashSet<Guid> wantedFindingIds = findingIds.ToHashSet();
        IReadOnlyList<RemediationInstanceRecord> rows = await ListByScopeAsync(scope, cancellationToken);

        return rows
            .Where(row => wantedFindingIds.Contains(row.FindingId)
                && row.Status == RemediationInstanceStatus.Approved)
            .GroupBy(row => row.FindingId)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(row => row.UpdatedUtc).First());
    }

    async Task<IReadOnlyDictionary<string, int>> CountOpenInstancesByStatusInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RemediationInstanceRecord> rows = await ListByScopeAsync(scope, cancellationToken);

        return rows
            .Where(row => row.Status != RemediationInstanceStatus.Closed)
            .GroupBy(row => row.Status.ToString())
            .ToDictionary(group => group.Key, group => group.Count());
    }

    async Task<RemediationFactoryInstanceMetricsAggregate> GetFactoryInstanceMetricsAggregateInScopeAsync(
        ProjectScopeKey scope,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RemediationInstanceRecord> instances = await ListByScopeAsync(scope, cancellationToken);

        int remediatedThisWeek = instances.Count(item =>
            item.VerifiedUtc.HasValue
            && item.VerifiedUtc.Value >= weekStartUtc
            && item.Status is RemediationInstanceStatus.Verified or RemediationInstanceStatus.Closed);

        int automatedCount = instances.Count(item =>
            item.AutomationLevel is RemediationAutomationLevel.SemiAutomated or RemediationAutomationLevel.Automated);

        int verificationFailures = instances.Count(item => item.Status == RemediationInstanceStatus.VerificationFailed);
        int businessBlocked = instances.Count(item => item.Status == RemediationInstanceStatus.PreflightBlocked);

        List<RemediationFactoryMetricKeyCount> topPatternKeys = instances
            .Where(item => !string.IsNullOrWhiteSpace(item.PatternKey))
            .GroupBy(item => item.PatternKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => new RemediationFactoryMetricKeyCount { Key = group.Key, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        return new RemediationFactoryInstanceMetricsAggregate
        {
            TotalInstances = instances.Count,
            RemediatedThisWeek = remediatedThisWeek,
            AutomatedCount = automatedCount,
            VerificationFailureCount = verificationFailures,
            BusinessBlockedCount = businessBlocked,
            TopPatternKeys = topPatternKeys,
        };
    }

    Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    async Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedInScopeAsync(
        ProjectScopeKey scope,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        (IReadOnlyList<RemediationInstanceRecord> items, _) =
            await ListByCloudResourceIdPagedAsync(scope.TenantId, cloudResourceId, page, pageSize, cancellationToken);
        IReadOnlyList<RemediationInstanceRecord> scoped = items
            .Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
            .ToList();
        return (scoped, scoped.Count);
    }

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RemediationInstanceRecord> rows =
            await ListByFindingIdAsync(scope.TenantId, findingId, cancellationToken);
        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    /// <summary>
    /// Instances in scope whose <see cref="RemediationInstanceRecord.ControlId"/> equals <paramref name="controlId"/>.
    /// SQL overrides this so the filter is not a tenant-wide scan.
    /// </summary>
    async Task<IReadOnlyList<RemediationInstanceRecord>> ListByControlIdInScopeAsync(
        ProjectScopeKey scope,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<RemediationInstanceRecord> rows = await ListByScopeAsync(scope, cancellationToken);

        return rows
            .Where(row => row.ControlId == controlId)
            .ToList();
    }
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
    public DateTime? ChangeImplementedUtc { get; init; }
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
            ChangeImplementedUtc = ChangeImplementedUtc,
            VerifiedUtc = VerifiedUtc,
            ClosedUtc = ClosedUtc,
        };
    }
}
