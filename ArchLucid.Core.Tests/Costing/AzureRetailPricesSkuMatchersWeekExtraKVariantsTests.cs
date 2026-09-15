using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersWeekExtraKVariantsTests
{
    [Theory]
    [InlineData("10week")]
    [InlineData("10weekk")]
    [InlineData("10weekkk")]
    [InlineData("10weekkkkkkkkkkkkkkkkk")]
    public void LooksLikeConsumptionUsd_accepts_compact_week_with_extra_k_suffixes(string unitOfMeasure)
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
    [InlineData("10week")]
    [InlineData("10weekk")]
    [InlineData("10weekkk")]
    [InlineData("10weekkkkkkkkkkkkkkkkk")]
    public void TryMonthlyUsdFromRow_accepts_compact_week_with_extra_k_suffixes(string unitOfMeasure)
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
        monthly.Should().BeApproximately(
            7m * (decimal)AzureRetailPricesCatalogClient.WeeksPerMonthAssumption,
            0.0001m);
    }

    [Theory]
    [InlineData("10 / week")]
    [InlineData("10 / weekk")]
    [InlineData("10 / weekkk")]
    [InlineData("10 / weekkkkkkkkkkkkkkkkk")]
    public void LooksLikeConsumptionUsd_accepts_spaced_slash_week_with_extra_k_tokens(string unitOfMeasure)
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
}
