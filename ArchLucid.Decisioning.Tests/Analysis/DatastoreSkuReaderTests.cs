using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Analysis;

public sealed class DatastoreSkuReaderTests
{
    [Fact]
    public void TryRead_maps_standard_lrs_to_single_region()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["sku"] = "Standard_LRS",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.SingleRegion);
        observedSku.Should().Be("Standard_LRS");
    }

    [Fact]
    public void TryRead_maps_premium_zrs_to_zone_redundant()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["skuName"] = "Premium_ZRS",
            },
            out DatastoreSkuTier tier,
            out string _);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.ZoneRedundant);
    }

    [Fact]
    public void TryRead_returns_false_when_sku_missing()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = "Data",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeFalse();
        tier.Should().Be(default);
        observedSku.Should().BeEmpty();
    }
}
