using ArchLucid.Persistence.Roi;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Roi;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantCostSettingsRepositoryTests
{
    [Fact]
    public async Task TryGetAsync_returns_null_when_tenant_has_no_row()
    {
        InMemoryTenantCostSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        TenantCostSettingsRecord? row = await repository.TryGetAsync(tenantId, CancellationToken.None);

        row.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_round_trips_and_clamps_non_positive_ea_multiplier()
    {
        InMemoryTenantCostSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset updated = DateTimeOffset.Parse("2026-06-01T12:00:00Z");

        TenantCostSettingsRecord input = new()
        {
            TenantId = tenantId,
            ArchitectHourlyRateUsd = 175m,
            AverageIncidentCostUsd = 30_000m,
            EaDiscountMultiplier = 0m,
            UpdatedUtc = updated,
            UpdatedByActorId = "operator"
        };

        await repository.UpsertAsync(input, CancellationToken.None);

        TenantCostSettingsRecord? loaded = await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ArchitectHourlyRateUsd.Should().Be(175m);
        loaded.EaDiscountMultiplier.Should().Be(1.0m);
        loaded.UpdatedByActorId.Should().Be("operator");
    }
}
