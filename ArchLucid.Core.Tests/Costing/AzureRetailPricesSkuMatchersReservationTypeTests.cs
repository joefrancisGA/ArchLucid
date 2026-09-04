using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersReservationTypeTests
{
    [Fact]
    public void LooksLikeConsumptionUsd_accepts_non_reservation_type_with_hourly_unit()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Non-Reservation",
            UnitOfMeasure = "1 Hour",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Fact]
    public void LooksLikeConsumptionUsd_accepts_non_reservation_underscore_type_with_hourly_unit()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Non_Reservation",
            UnitOfMeasure = "1 Hour",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
