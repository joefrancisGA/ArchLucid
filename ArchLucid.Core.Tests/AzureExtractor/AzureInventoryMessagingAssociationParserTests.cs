using System.Text.Json;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryMessagingAssociationParserTests
{
    private const string CaptureStorageId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/capturestore";

    [Fact]
    public void TryParse_reads_capture_storage_account_id_from_json_reference_object()
    {
        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "parentResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1",
                                                              "childResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1/eventhubs/orders",
                                                              "childName": "orders",
                                                              "childType": "eventHub",
                                                              "collectionStatus": "Succeeded",
                                                              "captureStorageAccountId": {
                                                                "id": "{{CaptureStorageId}}"
                                                              }
                                                            }
                                                            """);

        bool parsed = AzureInventoryMessagingAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.CaptureStorageAccountId.Should().Be(CaptureStorageId);
    }

    [Fact]
    public void TryParse_reads_capture_storage_account_id_from_json_reference_string_scalar()
    {
        string jsonBlob = JsonSerializer.Serialize(new { id = CaptureStorageId });

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "parentResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1",
                                                              "childResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1/eventhubs/orders",
                                                              "childName": "orders",
                                                              "childType": "eventHub",
                                                              "collectionStatus": "Succeeded",
                                                              "captureStorageAccountId": {{JsonSerializer.Serialize(jsonBlob)}}
                                                            }
                                                            """);

        bool parsed = AzureInventoryMessagingAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.CaptureStorageAccountId.Should().Be(CaptureStorageId);
    }

    [Fact]
    public void TryParse_reads_capture_storage_account_id_from_percent_encoded_and_quote_wrapped_plain_string()
    {
        string encoded = Uri.EscapeDataString("\"" + CaptureStorageId + "\"");

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "parentResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1",
                                                              "childResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1/eventhubs/orders",
                                                              "childName": "orders",
                                                              "childType": "eventHub",
                                                              "collectionStatus": "Succeeded",
                                                              "captureStorageAccountId": "{{encoded}}"
                                                            }
                                                            """);

        bool parsed = AzureInventoryMessagingAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.CaptureStorageAccountId.Should().Be(CaptureStorageId);
    }

    [Fact]
    public void TryParse_reads_capture_storage_account_id_from_percent_encoded_plain_string()
    {
        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "parentResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1",
                                                              "childResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1/eventhubs/orders",
                                                              "childName": "orders",
                                                              "childType": "eventHub",
                                                              "collectionStatus": "Succeeded",
                                                              "captureStorageAccountId": "{{Uri.EscapeDataString(CaptureStorageId)}}"
                                                            }
                                                            """);

        bool parsed = AzureInventoryMessagingAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.CaptureStorageAccountId.Should().Be(CaptureStorageId);
    }

    [Fact]
    public void TryParse_reads_capture_storage_account_id_from_json_reference_object_with_quoted_string_id()
    {
        string idValueWithSurroundingQuotes = "\"" + CaptureStorageId + "\"";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
              {
                "parentResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1",
                "childResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1/eventhubs/orders",
                "childName": "orders",
                "childType": "eventHub",
                "collectionStatus": "Succeeded",
                "captureStorageAccountId": {
                  "id": {{JsonSerializer.Serialize(idValueWithSurroundingQuotes)}}
                }
              }
              """);

        bool parsed = AzureInventoryMessagingAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row,
            out string? error);

        parsed.Should().BeTrue(error);
        row!.CaptureStorageAccountId.Should().Be(CaptureStorageId);
    }
}
