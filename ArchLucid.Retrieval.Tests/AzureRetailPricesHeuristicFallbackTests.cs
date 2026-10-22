using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesHeuristicFallbackTests
{
    [Fact]
    public void TryGetMonthlyUsd_known_sku_returns_estimate()
    {
        bool found = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(
            "Virtual Machines",
            "Standard_D4s_v5",
            out decimal monthlyUsd);

        found.Should().BeTrue();
        monthlyUsd.Should().Be(140m);
    }

    [Theory]
    [InlineData("Azure App Service", "S1", 75)]
    [InlineData("Azure App Service", "P1v2", 150)]
    [InlineData("Azure SQL Database", "S0", 15)]
    [InlineData("Azure SQL Database", "BC_Gen5_2", 300)]
    [InlineData("Azure Cache for Redis", "C0", 50)]
    [InlineData("Azure Cache for Redis", "P1", 150)]
    [InlineData("Storage Accounts", "Standard_LRS", 20)]
    public void TryGetMonthlyUsd_service_specific_fallbacks_return_estimates(
        string serviceName,
        string sku,
        decimal expectedMonthlyUsd)
    {
        bool found = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        found.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Fact]
    public void TryGetMonthlyUsd_same_sku_resolves_by_service_name()
    {
        AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd("Azure App Service", "S1", out decimal appServiceUsd)
            .Should().BeTrue();
        appServiceUsd.Should().Be(75m);

        AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd("Azure SQL Database", "S1", out decimal sqlUsd)
            .Should().BeTrue();
        sqlUsd.Should().Be(50m);
    }

    [Fact]
    public void FormatForPrompt_marks_heuristic_rows()
    {
        AzureRetailPriceRow row = new(
            "Virtual Machines",
            "Standard_D4s_v5",
            "eastus",
            "Standard_D4s_v5",
            140m,
            "USD",
            IsHeuristicFallback: true);

        InMemoryAzureRetailPriceStructuredLookup lookup = new();
        string formatted = lookup.FormatForPrompt(row);

        formatted.Should().StartWith("[Fallback Estimate]");
    }
}
