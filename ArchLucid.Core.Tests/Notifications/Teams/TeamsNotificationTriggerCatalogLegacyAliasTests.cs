using System.Text.Json;

using ArchLucid.Core.Integration;
using ArchLucid.Core.Notifications.Teams;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Notifications.Teams;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TeamsNotificationTriggerCatalogLegacyAliasTests
{
    private const string LegacyVendorPrefix = "com." + "arch" + "iforge" + ".";

    [Fact]
    public void IsKnown_returns_true_for_legacy_vendor_alias_of_catalog_trigger()
    {
        string legacy = ToLegacyVendorType(IntegrationEventTypes.AuthorityRunCompletedV1);

        TeamsNotificationTriggerCatalog.IsKnown(legacy).Should().BeTrue();
    }

    [Fact]
    public void ParseOrDefault_maps_legacy_vendor_alias_to_single_catalog_trigger()
    {
        string legacy = ToLegacyVendorType(IntegrationEventTypes.AuthorityRunCompletedV1);
        string json = JsonSerializer.Serialize(new[] { legacy });

        IReadOnlyList<string> parsed = TeamsNotificationTriggerCatalog.ParseOrDefault(json);

        parsed.Should().Equal(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    private static string ToLegacyVendorType(string canonical)
    {
        return canonical.Replace("com.archlucid.", LegacyVendorPrefix, StringComparison.Ordinal);
    }
}
