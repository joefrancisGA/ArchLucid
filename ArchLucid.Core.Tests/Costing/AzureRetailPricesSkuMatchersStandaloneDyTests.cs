using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersStandaloneDyTests
{
    [Theory]
    [InlineData("dy")]
    public void LooksLikeConsumptionUsd_accepts_standalone_dy_day_unit_of_measure_synonyms(string unitOfMeasure)
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

    [Theory]
    [InlineData("dy")]
    public void TryMonthlyUsdFromRow_accepts_standalone_dy_day_unit_of_measure_synonyms(string unitOfMeasure)
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
}
