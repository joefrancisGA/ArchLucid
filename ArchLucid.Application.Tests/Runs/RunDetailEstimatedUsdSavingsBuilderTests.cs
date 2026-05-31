using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunDetailEstimatedUsdSavingsBuilderTests
{
    [Fact]
    public async Task TryBuildAsync_returns_null_when_resolver_yields_no_savings()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        RunRecord run = new()
        {
            RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TenantId = tenantId,
            FindingsSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        };

        Mock<ITenantEstimatedUsdSavingsResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(run.FindingsSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantSettings = new();

        RunEstimatedUsdSavingsDto? result = await RunDetailEstimatedUsdSavingsBuilder.TryBuildAsync(
            run,
            resolver.Object,
            tenantSettings.Object,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task TryBuildAsync_maps_positive_savings_with_ea_pricing_basis()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        RunRecord run = new()
        {
            RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TenantId = tenantId,
            FindingsSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        };

        Mock<ITenantEstimatedUsdSavingsResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(run.FindingsSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(12_500m);

        Mock<ITenantCostSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(r => r.TryGetAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantCostSettingsRecord { TenantId = tenantId, EaDiscountMultiplier = 0.85m });

        RunEstimatedUsdSavingsDto? result = await RunDetailEstimatedUsdSavingsBuilder.TryBuildAsync(
            run,
            resolver.Object,
            tenantSettings.Object,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.EstimatedUsdSavings.Should().Be(12_500m);
        result.SavingsPricingBasis.Should().Be(ExecutiveRoiSavingsPricingBasis.EaAdjusted);
        result.SavingsPricingBasisDescription.Should().Contain("executive ROI");
    }
}
