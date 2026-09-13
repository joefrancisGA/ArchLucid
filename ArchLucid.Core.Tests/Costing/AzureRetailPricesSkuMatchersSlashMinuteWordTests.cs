using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersSlashMinuteWordTests
{
    [Theory]
    [InlineData("1/minute")]
    [InlineData("/minute")]
    [InlineData("1/minutes")]
    [InlineData("/minutes")]
    public void LooksLikeConsumptionUsd_accepts_slash_minute_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 2m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Theory]
    [InlineData("1/minute")]
    [InlineData("/minute")]
    [InlineData("1/minutes")]
    [InlineData("/minutes")]
    public void TryMonthlyUsdFromRow_accepts_slash_minute_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 2m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().BeApproximately(2m * (decimal)AzureRetailPricesCatalogClient.MinutesPerMonthAssumption, 0.0001m);
    }
}
