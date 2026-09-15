using ArchLucid.Core.Costing;
using FluentAssertions;
namespace ArchLucid.Core.Tests.Costing;
[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests
{
    [Theory][InlineData("10weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")]
    public void LooksLikeConsumptionUsd_accepts_weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk_week_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new() { CurrencyCode = "USD", Type = "Consumption", UnitOfMeasure = unitOfMeasure, UnitPrice = 1m };
        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
