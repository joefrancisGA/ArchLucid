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

    [Fact]
    public void TryReadScalarString_returns_null_for_json_reference_without_subscription_arm_id()
    {
        using JsonDocument document = JsonDocument.Parse("""{"id":"not-an-arm-id"}""");

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryReadScalarString_returns_null_for_json_string_scalar_without_subscription_arm_id()
    {
        string jsonBlob = JsonSerializer.Serialize(new { id = "not-an-arm-id" });
        using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(jsonBlob));

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryReadScalarString_reads_subscription_arm_id_from_json_string_scalar_wrapping_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string jsonBlob = JsonSerializer.Serialize(new { id = armId });
        using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(jsonBlob));

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .Be(armId);
    }
}
