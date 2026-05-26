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
