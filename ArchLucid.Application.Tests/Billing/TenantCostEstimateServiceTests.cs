using ArchLucid.Application.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Billing;
[Trait("Category", "Unit")]

public sealed class TenantCostEstimateServiceTests
{
    [SkippableFact]
    public async Task TryGetEstimateAsync_missing_tenant_returns_null()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantCostEstimateService sut = new(
            tenants.Object,
            new BillingOptionsTestMonitor<BillingUnitRatesOptions>(new BillingUnitRatesOptions()));

        TenantCostEstimate? result = await sut.TryGetEstimateAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_standard_tenant_returns_band()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Tier = TenantTier.Standard });

        BillingUnitRatesOptions rates = new() { Currency = "USD", StandardMonthlyUsdLow = 10, StandardMonthlyUsdHigh = 20, };

        TenantCostEstimateService sut = new(tenants.Object, new BillingOptionsTestMonitor<BillingUnitRatesOptions>(rates));

        TenantCostEstimate? result = await sut.TryGetEstimateAsync(Guid.NewGuid());

        result.Should().NotBeNull();
        result.EstimatedMonthlyUsdLow.Should().Be(10);
        result.EstimatedMonthlyUsdHigh.Should().Be(20);
        result.Tier.Should().Be(TenantTier.Standard);
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_unknown_tier_returns_null()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Tier = (TenantTier)99 });

        BillingUnitRatesOptions rates = new() { Currency = "USD", StandardMonthlyUsdLow = 10, StandardMonthlyUsdHigh = 20, };

        TenantCostEstimateService sut = new(tenants.Object, new BillingOptionsTestMonitor<BillingUnitRatesOptions>(rates));

        TenantCostEstimate? result = await sut.TryGetEstimateAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_orders_inverted_standard_and_enterprise_bands()
    {
        BillingUnitRatesOptions rates = new()
        {
            Currency = "USD",
            StandardMonthlyUsdLow = 500,
            StandardMonthlyUsdHigh = 100,
            EnterpriseMonthlyUsdLow = 900,
            EnterpriseMonthlyUsdHigh = 200,
        };

        TenantCostEstimate? standard = await EstimateAsync(TenantTier.Standard, rates);
        TenantCostEstimate? enterprise = await EstimateAsync(TenantTier.Enterprise, rates);

        standard.Should().NotBeNull();
        standard!.EstimatedMonthlyUsdLow.Should().Be(100);
        standard.EstimatedMonthlyUsdHigh.Should().Be(500);
        enterprise.Should().NotBeNull();
        enterprise!.EstimatedMonthlyUsdLow.Should().Be(200);
        enterprise.EstimatedMonthlyUsdHigh.Should().Be(900);
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_rejects_blank_configured_currency()
    {
        BillingUnitRatesOptions rates = new()
        {
            Currency = "   ",
            StandardMonthlyUsdLow = 10,
            StandardMonthlyUsdHigh = 20,
        };

        TenantCostEstimate? result = await EstimateAsync(TenantTier.Standard, rates);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_rejects_negative_configured_standard_rates()
    {
        BillingUnitRatesOptions rates = new()
        {
            Currency = "USD",
            StandardMonthlyUsdLow = -10,
            StandardMonthlyUsdHigh = -1,
        };

        TenantCostEstimate? result = await EstimateAsync(TenantTier.Standard, rates);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_free_tenant_omits_commercial_openai_widen_copy()
    {
        BillingUnitRatesOptions rates = new() { Currency = "USD" };

        TenantCostEstimate? result = await EstimateAsync(TenantTier.Free, rates);

        result.Should().NotBeNull();
        result!.EstimatedMonthlyUsdLow.Should().Be(0);
        result.EstimatedMonthlyUsdHigh.Should().Be(0);
        result.Factors.Should().Contain(factor =>
            factor.Contains("Free tier", StringComparison.OrdinalIgnoreCase));
        result.Factors.Should().NotContain(factor =>
            factor.Contains("Azure OpenAI", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task TryGetEstimateAsync_standard_tenant_with_zero_configured_rates_explains_unconfigured_band()
    {
        BillingUnitRatesOptions rates = new()
        {
            Currency = "USD",
            StandardMonthlyUsdLow = 0,
            StandardMonthlyUsdHigh = 0,
        };

        TenantCostEstimate? result = await EstimateAsync(TenantTier.Standard, rates);

        result.Should().NotBeNull();
        result!.EstimatedMonthlyUsdLow.Should().Be(0);
        result.EstimatedMonthlyUsdHigh.Should().Be(0);
        result.Factors.Should().Contain(factor =>
            factor.Contains("not configured", StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<TenantCostEstimate?> EstimateAsync(TenantTier tier, BillingUnitRatesOptions rates)
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Tier = tier });

        TenantCostEstimateService sut = new(tenants.Object, new BillingOptionsTestMonitor<BillingUnitRatesOptions>(rates));

        return await sut.TryGetEstimateAsync(Guid.NewGuid());
    }
}
