using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersStandaloneDayTests
{
    [Theory]
    [InlineData("day")]
    [InlineData("days")]
    public void TryMonthlyUsdFromRow_accepts_standalone_day_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 1m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().BeApproximately(1m * (decimal)AzureRetailPricesCatalogClient.DaysPerMonthAssumption, 0.0001m);
    }

    [Theory]
    [InlineData("day")]
    [InlineData("days")]
    [InlineData("1 Day")]
    public void LooksLikeConsumptionUsd_accepts_daily_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 1m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_quantity_prefixed_day_unit_of_measure()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Day",
            UnitPrice = 2m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().BeApproximately(2m * (decimal)AzureRetailPricesCatalogClient.DaysPerMonthAssumption, 0.0001m);
    }
}
