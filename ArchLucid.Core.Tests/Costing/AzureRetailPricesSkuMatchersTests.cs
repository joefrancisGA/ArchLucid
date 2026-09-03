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

    [Theory]
    [InlineData("Standard_D4", "Standard_D4s_v5")]
    [InlineData("Standard_E2", "Standard_E2s_v5")]
    public void RowMatchesSku_rejects_letter_suffix_series_collision(string armSku, string retailSku)
    {
        AzureRetailPricesCatalogClient.RowMatchesSku(armSku, retailSku)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void RowMatchesSku_rejects_letter_prefix_series_collision_against_ve_family()
    {
        AzureRetailPricesCatalogClient.RowMatchesSku("E2s_v5", "Standard_VE2s_v5")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void RowMatchesSku_accepts_standard_e_series_when_hint_omits_standard_prefix()
    {
        AzureRetailPricesCatalogClient.RowMatchesSku("E2s_v5", "Standard_E2s_v5")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void LooksLikeConsumptionUsd_rejects_horsepower_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 horsepower",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeFalse();
    }

    [Fact]
    public void LooksLikeConsumptionUsd_rejects_moment_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1 moment",
            UnitPrice = 12.34m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeFalse();
    }

    [Fact]
    public void LooksLikeConsumptionUsd_rejects_health_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/health",
            UnitPrice = 0.01m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeFalse();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_rejects_health_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/health",
            UnitPrice = 0.01m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeFalse();
        monthly.Should().Be(0m);
    }

    [Fact]
    public void LooksLikeConsumptionUsd_rejects_moment_slash_mo_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/moment",
            UnitPrice = 12.34m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeFalse();
    }

    [Fact]
    public void TryMonthlyUsdFromRow_rejects_moment_slash_mo_unit_of_measure_false_positive()
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = "1/moment",
            UnitPrice = 12.34m,
        };

        bool ok = AzureRetailPricesCatalogClient.TryMonthlyUsdFromRow(dto, 1, out decimal monthly);

        ok.Should().BeFalse();
        monthly.Should().Be(0m);
    }
}
