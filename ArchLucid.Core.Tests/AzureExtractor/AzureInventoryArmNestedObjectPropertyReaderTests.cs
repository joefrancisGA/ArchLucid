using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryArmNestedObjectPropertyReaderTests
{
    [Fact]
    public void TryReadString_reads_flat_scalar_on_object()
    {
        using JsonDocument document = JsonDocument.Parse("""{ "resourceId": "/subscriptions/sub/resourceGroups/rg" }""");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub/resourceGroups/rg");
    }

    [Fact]
    public void TryReadString_reads_scalar_from_nested_properties_bag()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "name": "dest",
              "properties": {
                "resourceId": "/subscriptions/sub/resourceGroups/rg"
              }
            }
            """);

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub/resourceGroups/rg");
    }

    [Fact]
    public void TryReadString_prefers_nested_properties_over_conflicting_top_level_value()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "resourceId": "/top-level",
              "properties": {
                "resourceId": "/nested"
              }
            }
            """);

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/nested");
    }
}
