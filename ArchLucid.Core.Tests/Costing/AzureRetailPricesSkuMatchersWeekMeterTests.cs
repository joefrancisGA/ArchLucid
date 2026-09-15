using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersWeekMeterTests
{
    public static TheoryData<string> WeekUnitOfMeasureSynonyms =>
    [
        "w",
        "wk",
        "/w",
        "wks",
        "/wk",
        "/wks",
        "10 W",
        "10wk",
        "10 w",
        "week",
        "10wks",
        "10wek",
        "weeks",
        "1/wks",
        "10 wk",
        "10wel",
        "10wels",
        "1/week",
        "10 / w",
        "/weeks",
        "10week",
        "10weks",
        "10 wks",
        "10 wek",
        "10weel",
        "10 wels",
        "10weeks",
        "10wekks",
        "10 weel",
        "1/weeks",
        "10 weks",
        "10weels",
        "10 weels",
        "10 / wel",
        "10weekes",
        "10 / wek",
        "10 weekes",
    ];

    [Theory]
    [MemberData(nameof(WeekUnitOfMeasureSynonyms))]
    public void LooksLikeConsumptionUsd_accepts_week_unit_of_measure_synonyms(string unitOfMeasure)
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
