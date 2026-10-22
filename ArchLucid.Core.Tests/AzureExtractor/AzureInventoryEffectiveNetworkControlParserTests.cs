using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryEffectiveNetworkControlParserTests
{
    [Fact]
    public void TryParse_valid_succeeded_row_maps_fields()
    {
        using JsonDocument document = JsonDocument.Parse("""
                                                        {
                                                          "nicResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
                                                          "kind": "effectiveNsg",
                                                          "collectionStatus": "Succeeded",
                                                          "effectiveResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
                                                          "payloadHashSha256": "abc123"
                                                        }
                                                        """);

        bool parsed = AzureInventoryEffectiveNetworkControlParser.TryParse(
            document.RootElement,
            out AzureInventoryEffectiveNetworkControlRow? row,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        row.Should().NotBeNull();
        row!.Kind.Should().Be(AzureInventoryEffectiveNetworkControlKind.EffectiveNsg);
        row.CollectionStatus.Should().Be(AzureInventoryEffectiveNetworkControlCollectionStatus.Succeeded);
        row.EffectiveResourceId.Should().Contain("networkSecurityGroups/nsg1");
        row.PayloadHashSha256.Should().Be("abc123");
    }

    [Fact]
    public void TryParse_skipped_row_without_target_is_valid()
    {
        using JsonDocument document = JsonDocument.Parse("""
                                                        {
                                                          "nicResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
                                                          "kind": "effectiveRoutes",
                                                          "collectionStatus": "Skipped"
                                                        }
                                                        """);

        bool parsed = AzureInventoryEffectiveNetworkControlParser.TryParse(
            document.RootElement,
            out AzureInventoryEffectiveNetworkControlRow? row,
            out string? _);

        parsed.Should().BeTrue();
        row.Should().NotBeNull();
        row!.EffectiveResourceId.Should().BeNull();
    }
}
