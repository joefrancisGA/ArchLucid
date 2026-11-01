using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

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
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(namespaceId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(eventHubId));
        row.CaptureStorageAccountId.Should().Be(captureStorageId);
        row.ChildType.Should().Be(AzureInventoryMessagingAssociationTypes.EventHub);
    }

    [Fact]
    public void TryExtractEventHub_reads_capture_storage_from_nested_destination_properties()
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
                                                                  "enabled": true,
                                                                  "destination": {
                                                                    "name": "EventHubCaptureDestination",
                                                                    "properties": {
                                                                      "storageAccountResourceId": "{{captureStorageId}}"
                                                                    }
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
        row!.CaptureStorageAccountId.Should().Be(captureStorageId);
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

    [Fact]
    public void TryExtractServiceBusChild_maps_forward_targets_on_topic()
    {
        using JsonDocument document = JsonDocument.Parse("""
                                                            {
                                                              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/ns/topics/orders",
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
            AzureInventoryMessagingAssociationTypes.ServiceBusTopic,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ForwardToName.Should().Be("archive");
        row.ForwardDeadLetteredMessagesToName.Should().Be("deadletters");
    }

    [Fact]
    public void TryExtractEventHub_reads_capture_when_enabled_is_string_true()
    {
        const string captureStorageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns/eventhubs/orders",
                                                              "name": "orders",
                                                              "properties": {
                                                                "captureDescription": {
                                                                  "enabled": "true",
                                                                  "destination": {
                                                                    "storageAccountResourceId": "{{captureStorageId}}"
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
        row!.CaptureStorageAccountId.Should().Be(captureStorageId);
    }

    [Fact]
    public void TryExtractEventHub_reads_parent_and_child_when_namespace_and_child_ids_are_percent_encoded_plain_arm_scalars()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string eventHubId = $"{namespaceId}/eventhubs/orders";
        string encodedChildId = Uri.EscapeDataString(eventHubId);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{encodedChildId}}",
                                                              "name": "orders"
                                                            }
                                                            """);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractEventHub(
            Uri.EscapeDataString(namespaceId),
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(namespaceId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(eventHubId));
    }

    [Fact]
    public void TryExtractServiceBusChild_reads_child_when_child_id_is_percent_encoded_plain_arm_scalar()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/ns";
        const string queueId = $"{namespaceId}/queues/orders";
        string encodedQueueId = Uri.EscapeDataString(queueId);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{encodedQueueId}}",
                                                              "name": "orders"
                                                            }
                                                            """);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractServiceBusChild(
            namespaceId,
            document.RootElement,
            AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(namespaceId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(queueId));
    }

    [Fact]
    public void TryExtractServiceBusChild_reads_parent_when_namespace_id_is_percent_encoded_plain_arm_scalar()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/ns";
        const string queueId = $"{namespaceId}/queues/orders";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{queueId}}",
                                                              "name": "orders"
                                                            }
                                                            """);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractServiceBusChild(
            Uri.EscapeDataString(namespaceId),
            document.RootElement,
            AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(namespaceId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(queueId));
    }
}
