using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Transactions;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch8Tests
{
    [Fact]
    public async Task InMemoryTenantCostSettingsRepository_clamps_non_positive_ea_multiplier()
    {
        InMemoryTenantCostSettingsRepository repository = new();
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        await repository.UpsertAsync(
            new TenantCostSettingsRecord
            {
                TenantId = tenantId,
                ArchitectHourlyRateUsd = 200m,
                AverageIncidentCostUsd = 10_000m,
                EaDiscountMultiplier = -1m,
                UpdatedUtc = DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
                UpdatedByActorId = "batch-8",
            },
            CancellationToken.None);

        TenantCostSettingsRecord? loaded = await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.EaDiscountMultiplier.Should().Be(1.0m);
    }

    [Fact]
    public async Task NullSponsorReportRecipientLookup_returns_empty_recipients()
    {
        NullSponsorReportRecipientLookup lookup = new();
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        IReadOnlyList<string> recipients = await lookup.ListRecipientMailboxesAsync(tenantId, CancellationToken.None);

        recipients.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryArchLucidUnitOfWorkFactory_returns_unit_of_work()
    {
        InMemoryArchLucidUnitOfWorkFactory factory = new();

        IArchLucidUnitOfWork unitOfWork = await factory.CreateAsync(CancellationToken.None);

        unitOfWork.Should().NotBeNull();
        unitOfWork.Should().BeAssignableTo<InMemoryArchLucidUnitOfWork>();
    }
}
