using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersMinuteTests
{
    [Theory]
    [InlineData("1/min")]
    [InlineData("/min")]
    [InlineData("minute")]
    [InlineData("minutes")]
    public void TryMonthlyUsdFromRow_accepts_minute_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().BeApproximately(
            0.01m * (decimal)AzureRetailPricesCatalogClient.MinutesPerMonthAssumption,
            0.0001m);
    }

    [Theory]
    [InlineData("1/min")]
    [InlineData("/min")]
    public void LooksLikeConsumptionUsd_accepts_minute_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
