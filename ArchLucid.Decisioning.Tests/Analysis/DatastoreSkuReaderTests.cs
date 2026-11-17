using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
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
    public void TryRead_maps_grs_when_zone_redundant_is_false()
    {
        // GRS is geo-redundant and not zone-redundant. Both keys are on the same datastore reader.
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["tf.zone_redundant"] = "false",
                ["tf.account_replication_type"] = "GRS",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.GeoRedundant);
        observedSku.Should().Be("GRS");
    }

    [Fact]
    public void TryRead_maps_single_region_when_geo_redundant_is_no_token()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["geoRedundant"] = "no",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.SingleRegion);
        observedSku.Should().Be("geoRedundant=false");
    }

    [Fact]
    public void TryRead_maps_geo_redundant_when_geo_redundant_is_yes_token()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["geoRedundant"] = "yes",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.GeoRedundant);
        observedSku.Should().Be("geoRedundant=true");
    }

    [Fact]
    public void TryRead_maps_zone_redundant_when_zone_redundant_is_on_token()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["zoneRedundant"] = "on",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.ZoneRedundant);
        observedSku.Should().Be("zoneRedundant=true");
    }

    [Fact]
    public void TryRead_maps_single_region_when_zone_redundant_is_no_token()
    {
        bool parsed = DatastoreSkuReader.TryRead(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["zoneRedundant"] = "no",
            },
            out DatastoreSkuTier tier,
            out string observedSku);

        parsed.Should().BeTrue();
        tier.Should().Be(DatastoreSkuTier.SingleRegion);
        observedSku.Should().Be("zoneRedundant=false");
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
