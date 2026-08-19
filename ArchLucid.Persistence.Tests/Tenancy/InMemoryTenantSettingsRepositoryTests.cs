using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantSettingsRepositoryTests
{
    [Fact]
    public async Task TryGetAsync_returns_null_when_setting_missing()
    {
        InMemoryTenantSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        string? value = await repository.TryGetAsync(tenantId, "realized-value.attestation", CancellationToken.None);

        value.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_round_trips_trimmed_key_and_value()
    {
        InMemoryTenantSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        await repository.UpsertAsync(tenantId, "  pilot.banner  ", "  enabled  ", CancellationToken.None);

        string? loaded = await repository.TryGetAsync(tenantId, "pilot.banner", CancellationToken.None);

        loaded.Should().Be("enabled");
    }

    [Fact]
    public async Task DeleteAsync_removes_existing_setting()
    {
        InMemoryTenantSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        await repository.UpsertAsync(tenantId, "feature.flag", "on", CancellationToken.None);
        await repository.DeleteAsync(tenantId, "feature.flag", CancellationToken.None);

        string? loaded = await repository.TryGetAsync(tenantId, "feature.flag", CancellationToken.None);

        loaded.Should().BeNull();
    }

    [Fact]
    public async Task TryGetAsync_throws_when_tenant_id_empty()
    {
        InMemoryTenantSettingsRepository repository = new();

        Func<Task> act = () => repository.TryGetAsync(Guid.Empty, "key", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }
}
