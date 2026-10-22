using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistenceNoOpStubCoverageTestsBatch2
{
    [Fact]
    public async Task NoOpFirstTenantFunnelArchivalBatchStore_returns_empty_and_deletes()
    {
        NoOpFirstTenantFunnelArchivalBatchStore sut = new();

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await sut.TakeRowsOlderThanAsync(retentionDays: 30, maxRows: 10, CancellationToken.None);

        rows.Should().BeEmpty();

        Func<Task> nullIds = () => sut.DeleteByEventIdsAsync(null!, CancellationToken.None);
        await nullIds.Should().ThrowAsync<ArgumentNullException>();

        await sut.Invoking(s => s.DeleteByEventIdsAsync([1, 2], CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task NoOpTenantSqlCatalogProvisioner_completes_without_side_effects()
    {
        NoOpTenantSqlCatalogProvisioner sut = new();

        await sut.Invoking(
                s => s.ProvisionTenantCatalogAsync(Guid.NewGuid(), "tenant-catalog", CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpWarmTenantCatalogStandbyRepository_returns_empty_claims()
    {
        NoOpWarmTenantCatalogStandbyRepository sut = new();

        (await sut.CountUnclaimedAsync(CancellationToken.None)).Should().Be(0);
        (await sut.TryClaimOldestUnclaimedAsync(CancellationToken.None)).Should().BeNull();
        await sut.Invoking(
                s => s.InsertStandbyAsync(
                    new WarmTenantCatalogStandbyRecord
                    {
                        StandbyId = Guid.NewGuid(),
                        SqlLogicalDatabaseName = "tenant-db",
                        SchemaReadyUtc = DateTimeOffset.UtcNow,
                        CreatedUtc = DateTimeOffset.UtcNow,
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
        await sut.Invoking(s => s.MarkClaimedAsync(Guid.NewGuid(), CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task NullTenantTrialEmailContactLookup_returns_null()
    {
        NullTenantTrialEmailContactLookup sut = new();

        (await sut.TryResolveAdminEmailAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task NoOpCosmosGraphSnapshotOutboxRepository_completes_enqueue_and_dequeue_paths()
    {
        NoOpCosmosGraphSnapshotOutboxRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        await sut.EnqueueAsync(Guid.NewGuid(), Guid.NewGuid(), tenantId, Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);
        (await sut.DequeuePendingAsync(10, 60, CancellationToken.None)).Should().BeEmpty();
        await sut.MarkProcessedAsync(Guid.NewGuid(), CancellationToken.None);
        await sut.RecordBackoffAfterProcessingFailureAsync(Guid.NewGuid(), DateTime.UtcNow, "err", CancellationToken.None);
        await sut.RecordDeadLetterAsync(Guid.NewGuid(), "err", CancellationToken.None);
    }

    [Fact]
    public async Task NoOpAuditEventChangeFeedHandler_completes()
    {
        NoOpAuditEventChangeFeedHandler sut = new();

        await sut.Invoking(s => s.HandleAsync([], CancellationToken.None)).Should().NotThrowAsync();
    }
}
