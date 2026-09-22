using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryMessagingAssociationExtractorTests
{
    [Fact]
    public void TryExtractEventHub_maps_capture_storage_destination()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string eventHubId = $"{namespaceId}/eventhubs/orders";
        const string captureStorageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/capturestore";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{eventHubId}}",
                                                              "name": "orders",
                                                              "properties": {
                                                                "captureDescription": {
                                                                  "destination": {
                                                                    "storageAccountResourceId": "{{captureStorageId}}"
                                                                  }
                                                                }
                                                              }
                                                            }
                                                            """);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractEventHub(
            namespaceId,
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(namespaceId);
        row.ChildResourceId.Should().Be(eventHubId);
        row.CaptureStorageAccountId.Should().Be(captureStorageId);
        row.ChildType.Should().Be(AzureInventoryMessagingAssociationTypes.EventHub);
    }
}
