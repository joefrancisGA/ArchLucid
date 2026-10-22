using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class AzureRetailPriceStructuredLookupTests
{
    [Fact]
    public void TryLookup_matches_service_region_and_sku()
    {
        InMemoryAzureRetailPriceStructuredLookup sut = new();

        bool found = sut.TryLookup("Virtual Machines", "eastus", "Standard_D2s_v5", out AzureRetailPriceRow row);

        found.Should().BeTrue();
        row.MeterName.Should().Be("D2s v5");
        row.UnitPriceUsd.Should().Be(0.096m);
    }

    [Fact]
    public void FormatForPrompt_includes_key_fields()
    {
        InMemoryAzureRetailPriceStructuredLookup sut = new();
        _ = sut.TryLookup("Storage", "eastus", "P10", out AzureRetailPriceRow row);

        string formatted = sut.FormatForPrompt(row);

        formatted.Should().Contain("Storage");
        formatted.Should().Contain("eastus");
        formatted.Should().Contain("P10");
        formatted.Should().Contain("USD");
    }
}
