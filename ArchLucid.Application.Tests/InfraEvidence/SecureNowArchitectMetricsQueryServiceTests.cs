using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectMetricsQueryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid FromSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ToSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task TryGetOutcomeMetricsAsync_foreign_snapshot_returns_null()
    {
        ScopeContext scope = CreateScope();
        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[FromSnapshotId] = BuildSnapshot(FromSnapshotId, TenantId, WorkspaceId, ProjectId);
        snapshotRepository.Snapshots[ToSnapshotId] = BuildSnapshot(
            ToSnapshotId,
            Guid.Parse("99999999-9999-9999-9999-999999999999"),
            WorkspaceId,
            ProjectId);

        SecureNowArchitectMetricsQueryService sut = new(
            snapshotRepository,
            new InMemoryPathRepository(),
            new InMemoryExceptionRepository(),
            new InMemoryFindingRepository());

        SecureNowArchitectOutcomeMetricsResponse? metrics = await sut.TryGetOutcomeMetricsAsync(
            scope,
            FromSnapshotId,
            ToSnapshotId,
            CancellationToken.None);

        metrics.Should().BeNull();
    }

    [Fact]
    public async Task TryGetOutcomeMetricsAsync_identical_snapshots_returns_zero_headline_metrics()
    {
        ScopeContext scope = CreateScope();
        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[FromSnapshotId] = BuildSnapshot(FromSnapshotId, TenantId, WorkspaceId, ProjectId);

        SecureNowArchitectMetricsQueryService sut = new(
            snapshotRepository,
            new InMemoryPathRepository(),
            new InMemoryExceptionRepository(),
            new InMemoryFindingRepository());

        SecureNowArchitectOutcomeMetricsResponse? metrics = await sut.TryGetOutcomeMetricsAsync(
            scope,
            FromSnapshotId,
            FromSnapshotId,
            CancellationToken.None);

        metrics.Should().NotBeNull();
        metrics!.CriticalOrHighConfidencePathsRemoved.Should().Be(0);
        metrics.SupportingOperationalMetrics!.OpenFindings.Should().Be(0);
        metrics.RuleVersion.Should().Be(SecureNowArchitectMetricsConstants.RuleVersion);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static AzureInventorySnapshotRecord BuildSnapshot(
        Guid snapshotId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId) =>
        new()
        {
            SnapshotId = snapshotId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PackageId = Guid.NewGuid(),
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            CaptureMethod = AzureInventoryCaptureMethod.HostedReader,
            CreatedUtc = DateTime.UtcNow.AddDays(-2),
            UpdatedUtc = DateTime.UtcNow.AddDays(-1),
        };

    private sealed class InMemorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        public Dictionary<Guid, AzureInventorySnapshotRecord> Snapshots { get; } = [];

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotRecord? snapshot);

            return Task.FromResult(snapshot);
        }

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<Guid?>(null);

        public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
            ScopeContext scope,
            int page,
            int pageSize,
            string? subscriptionId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)>(([], 0));
    }

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>([]);

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new SecurityEvidencePathInsertResult { PathId = pathHeader.PathId, Created = true });

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>([]);
    }

    private sealed class InMemoryExceptionRepository : IOperationalSecurityExceptionRepository
    {
        public Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid exceptionId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityExceptionRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid exceptionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task RevokeAsync(
            Guid tenantId,
            Guid exceptionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<bool> HasActiveExceptionForFindingAsync(
            Guid tenantId,
            Guid findingId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default)
            => Task.FromResult(false);
    }

    private sealed class InMemoryFindingRepository : IOperationalSecurityFindingRepository
    {
        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            Contracts.Common.CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>([]);

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
