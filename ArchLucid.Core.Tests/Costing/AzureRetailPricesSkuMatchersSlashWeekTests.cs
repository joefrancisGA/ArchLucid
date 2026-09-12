using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersSlashWeekTests
{
    [Theory]
    [InlineData("1/week")]
    [InlineData("/wk")]
    [InlineData("week")]
    [InlineData("weeks")]
    [InlineData("wk")]
    [InlineData("wks")]
    public void TryMonthlyUsdFromRow_accepts_week_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 7m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().BeApproximately(7m * (decimal)AzureRetailPricesCatalogClient.WeeksPerMonthAssumption, 0.0001m);
    }

    [Theory]
    [InlineData("1/week")]
    [InlineData("/wk")]
    [InlineData("wk")]
    [InlineData("wks")]
    public void LooksLikeConsumptionUsd_accepts_week_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 7m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
