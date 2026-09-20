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

    Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

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
