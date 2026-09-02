using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersTests
{
    [Fact]
    public void TryMonthlyUsdFromRow_accepts_hr_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Hr",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }

    [Fact]
    public void LooksLikeConsumptionUsd_accepts_hr_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Hr",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_h_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 h",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }
}
