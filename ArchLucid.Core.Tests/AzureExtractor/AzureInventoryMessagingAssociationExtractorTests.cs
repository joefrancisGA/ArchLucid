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

    [Fact]
    public void TryExtractEventHub_ignores_disabled_capture()
    {
        using JsonDocument document = JsonDocument.Parse("""
                                                            {
                                                              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns/eventhubs/orders",
                                                              "name": "orders",
                                                              "properties": {
                                                                "captureDescription": {
                                                                  "enabled": false,
                                                                  "destination": {
                                                                    "storageAccountResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store"
                                                                  }
                                                                }
                                                              }
                                                            }
                                                            """);

        AzureInventoryMessagingAssociationExtractor.TryExtractEventHub(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns",
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row);

        row.Should().NotBeNull();
        row!.CaptureStorageAccountId.Should().BeNull();
    }

    [Fact]
    public void TryExtractServiceBusChild_maps_forward_targets()
    {
        using JsonDocument document = JsonDocument.Parse("""
                                                            {
                                                              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/ns/queues/orders",
                                                              "name": "orders",
                                                              "properties": {
                                                                "forwardTo": "archive",
                                                                "forwardDeadLetteredMessagesTo": "deadletters"
                                                              }
                                                            }
                                                            """);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractServiceBusChild(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/ns",
            document.RootElement,
            AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ForwardToName.Should().Be("archive");
        row.ForwardDeadLetteredMessagesToName.Should().Be("deadletters");
    }
}
