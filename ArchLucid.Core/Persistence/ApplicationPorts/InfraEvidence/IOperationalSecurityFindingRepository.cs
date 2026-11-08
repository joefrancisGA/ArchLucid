using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityFindingRepository
{
    Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
        Guid tenantId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    async Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyInScopeAsync(
        ProjectScopeKey scope,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? record = await TryGetByNaturalKeyAsync(
            scope.TenantId,
            provider,
            sourceSystem,
            sourceFindingId,
            cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    async Task<OperationalSecurityFindingRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? record =
            await TryGetByIdAsync(scope.TenantId, findingId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    async Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyList<Guid> findingIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findingIds);

        List<OperationalSecurityFindingRecord> results = [];

        foreach (Guid findingId in findingIds.Where(id => id != Guid.Empty).Distinct())
        {
            OperationalSecurityFindingRecord? finding =
                await TryGetByIdInScopeAsync(scope, findingId, cancellationToken);

            if (finding is not null)
                results.Add(finding);
        }

        return results;
    }

    Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
        Guid tenantId,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityFindingRecord> rows =
            await ListByTenantAsync(scope.TenantId, status, cancellationToken);

        return rows
            .Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
            .ToList();
    }

    Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    async Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedInScopeAsync(
        ProjectScopeKey scope,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        (IReadOnlyList<OperationalSecurityFindingRecord> items, _) =
            await ListByCloudResourceIdPagedAsync(scope.TenantId, cloudResourceId, page, pageSize, cancellationToken);
        IReadOnlyList<OperationalSecurityFindingRecord> scoped = items
            .Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
            .ToList();
        return (scoped, scoped.Count);
    }

    Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        // A tenant-only lookup is insufficient: path citations must not cross workspaces/projects.
        IReadOnlyList<OperationalSecurityFindingRecord> findings =
            await ListByScopeAsync(scope, null, cancellationToken);
        return findings
            .Where(finding => finding.PathId == pathId
                && scope.Matches(finding.TenantId, finding.WorkspaceId, finding.ProjectId))
            .OrderByDescending(finding => finding.LastObservedUtc)
            .ThenBy(finding => finding.FindingId)
            .Select(finding => finding.FindingId)
            .ToList();
    }

    Task<IReadOnlyDictionary<Guid, IReadOnlyList<Guid>>> ListFindingIdsBySnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        // Finding records do not carry the snapshot identity of the cited path.
        // Do not mislabel all project findings as belonging to this snapshot.
        // The SQL implementation joins the path table and overrides this fallback.
        IReadOnlyDictionary<Guid, IReadOnlyList<Guid>> empty =
            new Dictionary<Guid, IReadOnlyList<Guid>>();
        return Task.FromResult(empty);
    }

    async Task<RemediationFactoryFindingMetricsAggregate> GetFactoryFindingMetricsAggregateInScopeAsync(
        ProjectScopeKey scope,
        DateTime weekStartUtc,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityFindingRecord> allFindings =
            await ListByScopeAsync(scope, null, cancellationToken);

        IReadOnlyList<OperationalSecurityFindingRecord> openFindings = allFindings
            .Where(item => item.Status is OperationalSecurityFindingStatus.Open or OperationalSecurityFindingStatus.Recurred)
            .ToList();

        int criticalExposure = openFindings.Count(item =>
            string.Equals(item.Severity, "critical", StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.Exposure, "high", StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.Exposure, "critical", StringComparison.OrdinalIgnoreCase));

        int createdThisWeek = allFindings.Count(item => item.CreatedUtc >= weekStartUtc);
        int recurrenceCount = allFindings.Count(item => item.Status == OperationalSecurityFindingStatus.Recurred);

        double averageAgeDays = openFindings.Count == 0
            ? 0
            : openFindings.Average(item => (utcNow - item.FirstObservedUtc).TotalDays);

        List<RemediationFactoryMetricKeyCount> topControlIds = openFindings
            .Where(item => !string.IsNullOrWhiteSpace(item.ControlId))
            .GroupBy(item => item.ControlId!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new RemediationFactoryMetricKeyCount { Key = group.Key, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        return new RemediationFactoryFindingMetricsAggregate
        {
            OpenFindings = openFindings.Count,
            CriticalExposureCount = criticalExposure,
            CreatedThisWeek = createdThisWeek,
            RecurrenceCount = recurrenceCount,
            AverageAgeDays = averageAgeDays,
            TopControlIds = topControlIds,
        };
    }

    async Task<int> CountOpenOrRecurredInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityFindingRecord> findings =
            await ListByScopeAsync(scope, status: null, cancellationToken);

        return findings.Count(item =>
            item.Status is OperationalSecurityFindingStatus.Open or OperationalSecurityFindingStatus.Recurred);
    }

    async Task<int> CountOutcomeRecurrencePairsInScopeAsync(
        ProjectScopeKey scope,
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityFindingRecord> findings =
            await ListByScopeAsync(scope, status: null, cancellationToken);

        return SecureNowOutcomeRecurrenceCounter.Count(findings, windowStartUtc, windowEndUtc);
    }

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        ListMetadataByFindingAsync(scope.TenantId, findingId, cancellationToken);

    async Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyList<Guid> findingIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findingIds);

        List<OperationalSecurityFindingMetadataRecord> metadata = [];

        foreach (Guid findingId in findingIds.Where(id => id != Guid.Empty).Distinct())
        {
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> rows =
                await ListMetadataByFindingInScopeAsync(scope, findingId, cancellationToken);

            metadata.AddRange(rows);
        }

        return metadata;
    }

    Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? finding = await TryGetByIdInScopeAsync(scope, findingId, cancellationToken);
        return finding is null
            ? []
            : await ListObservationsByFindingAsync(scope.TenantId, findingId, cancellationToken);
    }

    Task InsertAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord observation,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord? observation,
        CancellationToken cancellationToken = default);

    async Task UpdateInScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingMutation mutation,
        IReadOnlyList<OperationalSecurityFindingMetadataMutation> metadata,
        OperationalSecurityFindingObservationMutation? observation,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.FindingId, cancellationToken);

        if (current is null)
            return;

        await UpdateAsync(
            mutation.ApplyTo(current),
            metadata.Select(item => item.ToRecord(scope.TenantId)).ToList(),
            observation?.ToRecord(scope.TenantId),
            cancellationToken);
    }
}

public sealed record OperationalSecurityFindingMutation
{
    public required Guid FindingId { get; init; }
    public Guid? CloudResourceId { get; init; }
    public string? ExternalResourceId { get; init; }
    public string? ResourceType { get; init; }
    public string? SubscriptionOrAccountId { get; init; }
    public string? ControlId { get; init; }
    public string? ControlFramework { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public string? Severity { get; init; }
    public decimal? RiskScore { get; init; }
    public string? Exploitability { get; init; }
    public string? Exposure { get; init; }
    public string? BusinessCriticality { get; init; }
    public string? BlastRadius { get; init; }
    public required DateTime LastObservedUtc { get; init; }
    public required OperationalSecurityFindingStatus Status { get; init; }
    public string? RawEvidenceReference { get; init; }
    public Guid? AssessmentId { get; init; }
    public Guid? InventoryDiffId { get; init; }
    public Guid? AuditEvidenceSnapshotId { get; init; }
    public Guid? PathId { get; init; }
    public required byte[] PayloadHashSha256 { get; init; }
    public required DateTime UpdatedUtc { get; init; }

    public OperationalSecurityFindingRecord ApplyTo(OperationalSecurityFindingRecord source)
    {
        if (source.FindingId != FindingId)
            throw new InvalidOperationException("Operational finding mutation id does not match the source record.");

        return new OperationalSecurityFindingRecord
        {
            FindingId = source.FindingId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            Provider = source.Provider,
            SourceSystem = source.SourceSystem,
            SourceFindingId = source.SourceFindingId,
            CloudResourceId = CloudResourceId,
            ExternalResourceId = ExternalResourceId,
            ResourceType = ResourceType,
            SubscriptionOrAccountId = SubscriptionOrAccountId,
            ControlId = ControlId,
            ControlFramework = ControlFramework,
            Title = Title,
            Description = Description,
            Severity = Severity,
            RiskScore = RiskScore,
            Exploitability = Exploitability,
            Exposure = Exposure,
            BusinessCriticality = BusinessCriticality,
            BlastRadius = BlastRadius,
            FirstObservedUtc = source.FirstObservedUtc,
            LastObservedUtc = LastObservedUtc,
            Status = Status,
            RawEvidenceReference = RawEvidenceReference,
            AssessmentId = AssessmentId,
            InventoryDiffId = InventoryDiffId,
            AuditEvidenceSnapshotId = AuditEvidenceSnapshotId,
            PathId = PathId,
            PayloadHashSha256 = PayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = UpdatedUtc,
        };
    }
}

public sealed record OperationalSecurityFindingMetadataMutation
{
    public required Guid MetadataRowId { get; init; }
    public required Guid FindingId { get; init; }
    public required string MetadataKey { get; init; }
    public string? MetadataValue { get; init; }

    public OperationalSecurityFindingMetadataRecord ToRecord(Guid tenantId) =>
        new()
        {
            MetadataRowId = MetadataRowId,
            FindingId = FindingId,
            TenantId = tenantId,
            MetadataKey = MetadataKey,
            MetadataValue = MetadataValue,
        };
}

public sealed record OperationalSecurityFindingObservationMutation
{
    public required Guid ObservationId { get; init; }
    public required Guid FindingId { get; init; }
    public required DateTime ObservedUtc { get; init; }
    public required OperationalSecurityFindingStatus Status { get; init; }
    public string? Severity { get; init; }
    public decimal? RiskScore { get; init; }
    public required string Summary { get; init; }
    public required byte[] PayloadHashSha256 { get; init; }
    public required string SourceSystem { get; init; }

    public OperationalSecurityFindingObservationRecord ToRecord(Guid tenantId) =>
        new()
        {
            ObservationId = ObservationId,
            FindingId = FindingId,
            TenantId = tenantId,
            ObservedUtc = ObservedUtc,
            Status = Status,
            Severity = Severity,
            RiskScore = RiskScore,
            Summary = Summary,
            PayloadHashSha256 = PayloadHashSha256,
            SourceSystem = SourceSystem,
        };
}
