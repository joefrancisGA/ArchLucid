using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiTenantPricingContextResolverTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task ResolveAsync_when_no_tenant_row_returns_retail_defaults()
    {
        SponsorRoiTenantPricingContextResolver sut = CreateSut(null);

        (decimal multiplier, string basis) = await sut.ResolveAsync(CancellationToken.None);

        multiplier.Should().Be(1.0m);
        basis.Should().Be(SponsorRoiSavingsPricingBasis.Retail);
    }

    [Fact]
    public async Task ResolveAsync_when_ea_multiplier_configured_returns_ea_adjusted_basis()
    {
        TenantCostSettingsRecord settings = new()
        {
            TenantId = TenantId,
            ArchitectHourlyRateUsd = 150m,
            AverageIncidentCostUsd = 25_000m,
            EaDiscountMultiplier = 0.85m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        SponsorRoiTenantPricingContextResolver sut = CreateSut(settings);

        (decimal multiplier, string basis) = await sut.ResolveAsync(CancellationToken.None);

        multiplier.Should().Be(0.85m);
        basis.Should().Be(SponsorRoiSavingsPricingBasis.EaAdjusted);
    }

    private static SponsorRoiTenantPricingContextResolver CreateSut(TenantCostSettingsRecord? settings)
    {
        Mock<ITenantCostSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(settings);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                ProjectId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
            });

        return new SponsorRoiTenantPricingContextResolver(repository.Object, scopeProvider.Object);
    }
}
