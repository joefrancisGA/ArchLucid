using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantMigrationStatusServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task GetForTenantAsync_returns_inactive_when_no_migration()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        Mock<ITenantRepository> tenants = CreateDefaultTenantRepository();
        TenantMigrationStatusService sut = new(migrations, tenants.Object);

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

        Mock<ITenantRepository> tenants = CreateDefaultTenantRepository();
        TenantMigrationStatusService sut = new(migrations, tenants.Object);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.True(snapshot.InMigration);
        Assert.Equal(migrationId, snapshot.MigrationId);
        Assert.Equal("corr-visibility", snapshot.CorrelationId);
        Assert.Equal(nameof(TenantCatalogMigrationStage.Verification), snapshot.Stage);
        Assert.Equal(
            "Committed review could not be loaded from the target catalog.",
            snapshot.LastVerificationError);
    }

    [Fact]
    public async Task GetForTenantAsync_treats_whitespace_only_last_verification_error_as_null()
    {
        Guid migrationId = Guid.Parse("44444444-5555-6666-7777-888888888888");
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-blank-error",
                Stage = TenantCatalogMigrationStage.Verification,
                StartedUtc = DateTimeOffset.UtcNow,
                LastVerificationError = "   ",
            },
            CancellationToken.None);

        TenantMigrationStatusService sut = new(migrations, CreateDefaultTenantRepository().Object);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.True(snapshot.InMigration);
        Assert.Null(snapshot.LastVerificationError);
    }

    [Fact]
    public async Task GetForTenantAsync_treats_whitespace_only_maintenance_message_as_null()
    {
        Guid migrationId = Guid.Parse("55555555-6666-7777-8888-999999999999");
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-blank-message",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = DateTimeOffset.UtcNow,
                MaintenanceMessage = "   ",
            },
            CancellationToken.None);

        TenantMigrationStatusService sut = new(migrations, CreateDefaultTenantRepository().Object);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.True(snapshot.InMigration);
        Assert.Null(snapshot.Message);
    }

    [Fact]
    public async Task GetForTenantAsync_clears_last_verification_error_after_successful_verification_mark()
    {
        Guid migrationId = Guid.Parse("33333333-4444-5555-6666-777777777777");
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-retry-clear",
                Stage = TenantCatalogMigrationStage.Verification,
                StartedUtc = DateTimeOffset.UtcNow,
                LastVerificationError = "first attempt failed",
            },
            CancellationToken.None);

        await migrations.MarkVerificationResultAsync(
            migrationId,
            passed: true,
            errorMessage: null,
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        TenantMigrationStatusService sut = new(migrations, CreateDefaultTenantRepository().Object);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.True(snapshot.InMigration);
        Assert.Null(snapshot.LastVerificationError);
        Assert.NotNull(snapshot.MigrationId);
    }

    [Fact]
    public async Task GetForTenantAsync_returns_inactive_when_active_migration_exists_but_tenant_is_in_erasure_quarantine()
    {
        Guid migrationId = Guid.Parse("22222222-3333-4444-5555-666666666666");
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-quarantine",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = DateTimeOffset.UtcNow.AddDays(-1),
                    OffboardedUtc = DateTimeOffset.UtcNow,
                    ErasureEligibleUtc = DateTimeOffset.UtcNow.AddDays(30),
                });

        TenantMigrationStatusService sut = new(migrations, tenants.Object);

        TenantMigrationStatusSnapshot snapshot = await sut.GetForTenantAsync(TenantId, CancellationToken.None);

        Assert.False(snapshot.InMigration);
        Assert.Null(snapshot.MigrationId);
        Assert.Null(snapshot.Stage);
    }

    private static Mock<ITenantRepository> CreateDefaultTenantRepository()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = DateTimeOffset.UtcNow.AddDays(-1),
                });

        return tenants;
    }
}
