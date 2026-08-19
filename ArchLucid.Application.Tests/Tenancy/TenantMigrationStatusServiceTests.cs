using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantMigrationStatusServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task GetForTenantAsync_returns_inactive_when_no_migration()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        TenantMigrationStatusService sut = new(migrations);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.False(snapshot.InMigration);
        Assert.Null(snapshot.CorrelationId);
        Assert.Null(snapshot.LastVerificationError);
    }

    [Fact]
    public async Task GetForTenantAsync_returns_operator_visibility_fields_when_migration_is_active()
    {
        Guid migrationId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-visibility",
                Stage = TenantCatalogMigrationStage.Verification,
                StartedUtc = DateTimeOffset.UtcNow,
                LastVerificationError = "Committed review could not be loaded from the target catalog.",
            },
            CancellationToken.None);

        TenantMigrationStatusService sut = new(migrations);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.True(snapshot.InMigration);
        Assert.Equal(migrationId, snapshot.MigrationId);
        Assert.Equal("corr-visibility", snapshot.CorrelationId);
        Assert.Equal(nameof(TenantCatalogMigrationStage.Verification), snapshot.Stage);
        Assert.Equal(
            "Committed review could not be loaded from the target catalog.",
            snapshot.LastVerificationError);
    }
}
