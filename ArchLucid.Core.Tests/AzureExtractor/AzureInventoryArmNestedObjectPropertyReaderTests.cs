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

    [Fact]
    public void TryReadScalarString_reads_subscription_arm_id_from_json_string_scalar_wrapping_quoted_string_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string jsonBlob = JsonSerializer.Serialize(new { id = "\"" + armId + "\"" });
        using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(jsonBlob));

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_subscription_arm_path_on_json_reference_object_id()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{"id":"{{Uri.EscapeDataString(armId)}}"}""");

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_subscription_arm_path_on_plain_string_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string encoded = Uri.EscapeDataString(armId);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encoded)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_doubly_percent_encoded_subscription_arm_path_with_trailing_slash()
    {
        const string armPath = "/subscriptions/sub/resourceGroups/rg/";
        string encodedOnce = Uri.EscapeDataString(armPath);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedTwice)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg");
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_subscription_arm_path_with_trailing_slash()
    {
        const string armPath = "/subscriptions/sub/resourceGroups/rg/";
        string encoded = Uri.EscapeDataString(armPath);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encoded)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg");
    }

    [Fact]
    public void TryReadScalarString_reads_resource_id_when_id_key_missing_on_percent_encoded_reference_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { resourceId = armId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_resource_id_when_id_is_empty_string_on_percent_encoded_reference_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = string.Empty, resourceId = armId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_resource_id_when_id_is_whitespace_only_on_percent_encoded_reference_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = "   ", resourceId = armId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_id_when_resource_id_is_empty_string_on_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(armId), resourceId = string.Empty });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_reference_object_with_percent_encoded_resource_id_value()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { resourceId = Uri.EscapeDataString(armId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_resource_id_when_id_is_empty_string_on_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = string.Empty, resourceId = armId });
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(referenceJson)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_resource_id_when_id_is_whitespace_on_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = "   ", resourceId = armId });
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(referenceJson)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_prefers_id_over_resource_id_when_both_present_on_reference_object()
    {
        const string idArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/from-id";
        const string resourceIdArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/from-resource-id";

        string referenceJson = JsonSerializer.Serialize(new { id = idArmId, resourceId = resourceIdArmId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(idArmId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_reference_object_with_resource_id_key()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { resourceId = armId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_reference_object_with_pascal_case_id()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { Id = Uri.EscapeDataString(armId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_reference_object_with_doubly_percent_encoded_id()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string encodedId = Uri.EscapeDataString(Uri.EscapeDataString(armId));
        string referenceJson = JsonSerializer.Serialize(new { id = encodedId });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string referenceJson = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(armId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_json_string_scalar_wrapping_subscription_arm_path_with_trailing_slash()
    {
        const string armPath = "/subscriptions/sub/resourceGroups/rg/";
        string referenceJson = JsonSerializer.Serialize(new { id = armPath });
        string encodedReference = Uri.EscapeDataString(referenceJson);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedReference)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg");
    }

    [Fact]
    public void TryReadScalarString_reads_triply_percent_encoded_subscription_prefix_plain_scalar()
    {
        const string armPath = "/subscriptions/sub/";
        string encodedOnce = Uri.EscapeDataString(armPath);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedThrice)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be("/subscriptions/sub");
    }

    [Fact]
    public void TryReadScalarString_reads_triply_percent_encoded_subscription_arm_path_on_plain_string_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string encodedOnce = Uri.EscapeDataString(armId);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedThrice)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_doubly_percent_encoded_subscription_arm_path_on_plain_string_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string encodedOnce = Uri.EscapeDataString(armId);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encodedTwice)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_reads_percent_encoded_and_quote_wrapped_subscription_arm_path_on_plain_string_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string encoded = Uri.EscapeDataString("\"" + armId + "\"");
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(encoded)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_strips_surrounding_quotes_from_plain_string_arm_id_scalar()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string idValueWithSurroundingQuotes = "\"" + armId + "\"";
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"resourceId\":{JsonSerializer.Serialize(idValueWithSurroundingQuotes)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadString(document.RootElement, "resourceId")
            .Should()
            .Be(armId);
    }

    [Fact]
    public void TryReadScalarString_strips_surrounding_quotes_from_json_encoded_string_arm_id_on_reference_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        string idValueWithSurroundingQuotes = "\"" + armId + "\"";
        using JsonDocument document = JsonDocument.Parse(
            $"{{\"id\":{JsonSerializer.Serialize(idValueWithSurroundingQuotes)}}}");

        AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(document.RootElement)
            .Should()
            .Be(armId);
    }
}
