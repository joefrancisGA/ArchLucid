using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersNonMonthlyTests
{
    [Fact]
    public void LooksLikeConsumptionUsd_rejects_nonmonthly_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 NonMonthly",
            UnitPrice = 12.34m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeFalse();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_rejects_nonmonthly_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 NonMonthly",
            UnitPrice = 12.34m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeFalse();
        monthly.Should().Be(0m);
    }
}
