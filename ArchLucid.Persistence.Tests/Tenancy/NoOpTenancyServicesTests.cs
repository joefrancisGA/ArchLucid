using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class NoOpTenancyServicesTests
{
    [Fact]
    public async Task NoOpTenantHardPurgeService_returns_empty_result()
    {
        NoOpTenantHardPurgeService sut = new();

        TenantHardPurgeResult result =
            await sut.PurgeTenantAsync(Guid.NewGuid(), new TenantHardPurgeOptions(), CancellationToken.None);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task NullTenantTrialEmailContactLookup_always_returns_null()
    {
        NullTenantTrialEmailContactLookup sut = new();

        string? email = await sut.TryResolveAdminEmailAsync(Guid.NewGuid(), CancellationToken.None);

        email.Should().BeNull();
    }

    [Fact]
    public async Task NoOpArchitectureProjectRetentionPurgeService_returns_empty_list()
    {
        NoOpArchitectureProjectRetentionPurgeService sut = new();

        IReadOnlyList<ArchitectureProjectPurgeDeletion> deleted =
            await sut.PurgeExpiredAsync(DateTimeOffset.UtcNow, CancellationToken.None);

        deleted.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpWarmTenantCatalogStandbyRepository_reports_no_standby_rows()
    {
        NoOpWarmTenantCatalogStandbyRepository sut = new();

        (await sut.CountUnclaimedAsync(CancellationToken.None)).Should().Be(0);
        (await sut.TryClaimOldestUnclaimedAsync(CancellationToken.None)).Should().BeNull();

        WarmTenantCatalogStandbyRecord record = new()
        {
            StandbyId = Guid.NewGuid(),
            SqlLogicalDatabaseName = "catalog",
            SchemaReadyUtc = DateTimeOffset.UtcNow,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        await sut.InsertStandbyAsync(record, CancellationToken.None);
        await sut.MarkClaimedAsync(record.StandbyId, CancellationToken.None);
    }
}
