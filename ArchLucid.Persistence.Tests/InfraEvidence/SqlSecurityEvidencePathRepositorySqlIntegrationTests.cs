using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlSecurityEvidencePathRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantA = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1");
    private static readonly Guid TenantB = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid WorkspaceId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3");
    private static readonly Guid ProjectId = Guid.Parse("b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4");

    [SkippableFact]
    public async Task Duplicate_canonical_hash_is_idempotent_and_tenant_isolated()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = CreatePathHeader(pathId, TenantA, snapshotId, utcNow);
        IReadOnlyList<SecurityEvidencePathHopRecord> hops = CreateHops(pathId, TenantA, PathConfidenceBand.HighlyLikely);

        SecurityEvidencePathInsertResult first = await repository.InsertIfNotExistsAsync(header, hops, CancellationToken.None);
        first.Created.Should().BeTrue();
        first.PathId.Should().Be(pathId);

        SecurityEvidencePathInsertResult second = await repository.InsertIfNotExistsAsync(
            CreatePathHeader(Guid.NewGuid(), TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        second.Created.Should().BeFalse();
        second.PathId.Should().Be(pathId);

        SecurityEvidencePathRecord? foreignTenant = await repository.TryGetByIdAsync(TenantB, pathId, CancellationToken.None);
        foreignTenant.Should().BeNull("paths are tenant-isolated.");
    }

    [SkippableFact]
    public async Task Insert_persists_weakest_link_band_and_hops()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, TenantA, 1, PathConfidenceBand.Confirmed, ProvenanceKind.ObservedFact),
            CreateHop(pathId, TenantA, 2, PathConfidenceBand.Possible, ProvenanceKind.DerivedFact),
        ];

        await repository.InsertIfNotExistsAsync(
            CreatePathHeader(pathId, TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        SecurityEvidencePathRecord? loaded = await repository.TryGetByIdAsync(TenantA, pathId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.PathConfidenceBand.Should().Be(PathConfidenceBand.Possible);
        loaded.WeakestHopOrdinal.Should().Be(2);

        IReadOnlyList<SecurityEvidencePathHopRecord> loadedHops =
            await repository.ListHopsByPathAsync(TenantA, pathId, CancellationToken.None);

        loadedHops.Should().HaveCount(2);
        loadedHops.Select(static hop => hop.HopOrdinal).Should().BeEquivalentTo([1, 2], options => options.WithStrictOrdering());
    }

    [SkippableFact]
    public async Task Insert_rejects_ai_inference_confirmed_hop()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, TenantA, 1, PathConfidenceBand.Confirmed, ProvenanceKind.AiInference),
        ];

        Func<Task> act = () => repository.InsertIfNotExistsAsync(
            CreatePathHeader(pathId, TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*AiInference*Confirmed*");
    }

    private static async Task<Guid> InsertSnapshotAsync(SqlConnectionFactory factory, Guid tenantId)
    {
        SqlAzureExtractorPackageRepository packageRepository = new(factory);
        SqlAzureInventorySnapshotRepository snapshotRepository = new(factory);

        Guid packageId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        await packageRepository.InsertAsync(
            new AzureExtractorPackageRecord
            {
                PackageId = packageId,
                TenantId = tenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                CreatedUtc = utcNow,
                SchemaVersion = 1,
                OriginalFileName = "inventory.zip",
                ManifestJson = "{}",
                PackageBytes = [0x50, 0x4B],
            },
            CancellationToken.None);

        Guid snapshotId = Guid.NewGuid();
        await snapshotRepository.InsertHeaderAsync(
            new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = tenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                PackageId = packageId,
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            CancellationToken.None);

        return snapshotId;
    }

    private static SecurityEvidencePathRecord CreatePathHeader(
        Guid pathId,
        Guid tenantId,
        Guid snapshotId,
        DateTime utcNow) =>
        new()
        {
            PathId = pathId,
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = snapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static IReadOnlyList<SecurityEvidencePathHopRecord> CreateHops(
        Guid pathId,
        Guid tenantId,
        PathConfidenceBand band) =>
    [
        CreateHop(pathId, tenantId, 1, band, ProvenanceKind.ObservedFact),
        CreateHop(pathId, tenantId, 2, band, ProvenanceKind.DerivedFact),
    ];

    private static SecurityEvidencePathHopRecord CreateHop(
        Guid pathId,
        Guid tenantId,
        int hopOrdinal,
        PathConfidenceBand band,
        ProvenanceKind provenance) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = tenantId,
            HopOrdinal = hopOrdinal,
            FromNodeId = $"actor-{hopOrdinal}",
            ToNodeId = $"resource-{hopOrdinal}",
            EdgeType = "privilege-assignment",
            ProvenanceKind = provenance,
            HopConfidenceBand = band,
            EvidenceReference = $"/subscriptions/sub/roleAssignments/{hopOrdinal}",
        };
}
