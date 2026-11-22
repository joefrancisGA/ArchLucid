using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantCatalogMigrationRepositoryTests
{
    [Fact]
    public async Task InsertAsync_enforces_catalog_migration_uniqueness()
    {
        InMemoryTenantCatalogMigrationRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        TenantCatalogMigrationRecord first = new() { MigrationId = Guid.NewGuid(), TenantId = tenantId };
        TenantCatalogMigrationRecord second = new() { MigrationId = Guid.NewGuid(), TenantId = tenantId };

        await repository.InsertAsync(first, CancellationToken.None);

        Func<Task> insertSecond = async () => await repository.InsertAsync(second, CancellationToken.None);
        await insertSecond.Should().ThrowAsync<InvalidOperationException>();
        (await repository.GetActiveByTenantIdAsync(tenantId, CancellationToken.None)).Should().BeSameAs(first);

        await repository.CompleteAsync(first.MigrationId, DateTimeOffset.UtcNow, CancellationToken.None);
        await repository.InsertAsync(second, CancellationToken.None);

        Func<Task> replaceCompleted = async () => await repository.InsertAsync(new()
        {
            MigrationId = first.MigrationId,
            TenantId = Guid.NewGuid(),
        }, CancellationToken.None);

        await replaceCompleted.Should().ThrowAsync<InvalidOperationException>();
        (await repository.GetByIdAsync(first.MigrationId, CancellationToken.None))!.IsActive.Should().BeFalse();
    }
}
