using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersTests
{
    [Fact]
    public void TryMonthlyUsdFromRow_accepts_hr_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Hr",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }

    [Fact]
    public void LooksLikeConsumptionUsd_accepts_hr_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Hr",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_h_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 h",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_mo_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 Mo",
            UnitPrice = 12.34m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 2, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(24.68m);
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_slash_mo_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/mo",
            UnitPrice = 12.34m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(12.34m);
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_slash_hr_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/hr",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }

    [Fact]
    public void TryMonthlyUsdFromRow_accepts_slash_h_unit_of_measure_synonym()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/h",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeTrue();
        monthly.Should().Be(7.30m);
    }

    [Fact]
    public void RowMatchesSku_rejects_d4_series_prefix_collision_against_d48()
    {
        AzureRetailPricesCatalogClient.RowMatchesSku("Standard_D4", "Standard_D48s_v5")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void RowMatchesSku_accepts_exact_d4s_v5_match()
    {
        AzureRetailPricesCatalogClient.RowMatchesSku("Standard_D4s_v5", "Standard_D4s_v5")
            .Should()
            .BeTrue();
    }
}
