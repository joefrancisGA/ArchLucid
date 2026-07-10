using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantSettingsRepositoryCoverageTests
{
    [Fact]
    public async Task Repository_round_trips_upsert_get_and_delete()
    {
        InMemoryTenantSettingsRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        const string key = "feature.flag";

        (await sut.TryGetAsync(tenantId, key, CancellationToken.None)).Should().BeNull();

        await sut.UpsertAsync(tenantId, key, " enabled ", CancellationToken.None);

        (await sut.TryGetAsync(tenantId, key, CancellationToken.None)).Should().Be("enabled");

        await sut.DeleteAsync(tenantId, key, CancellationToken.None);

        (await sut.TryGetAsync(tenantId, key, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task Repository_validates_tenant_and_key()
    {
        InMemoryTenantSettingsRepository sut = new();

        Func<Task> emptyTenant = () => sut.TryGetAsync(Guid.Empty, "k", CancellationToken.None);
        await emptyTenant.Should().ThrowAsync<ArgumentException>();

        Func<Task> blankKey = () => sut.UpsertAsync(Guid.NewGuid(), "  ", "v", CancellationToken.None);
        await blankKey.Should().ThrowAsync<ArgumentException>();
    }
}
