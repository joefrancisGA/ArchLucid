using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersGovernmentTierTests
{
    [Fact]
    public void LooksLikeConsumptionUsd_accepts_non_government_meter_tier_with_hourly_unit()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            MeterTier = "Non-Government",
            UnitOfMeasure = "1 Hour",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Fact]
    public void LooksLikeConsumptionUsd_accepts_non_government_underscore_meter_tier_with_hourly_unit()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            MeterTier = "Non_Government",
            UnitOfMeasure = "1 Hour",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
