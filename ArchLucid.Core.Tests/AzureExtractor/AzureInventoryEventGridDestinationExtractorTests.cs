using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridDestinationExtractorTests
{
    [Fact]
    public void Extract_reads_webhook_destination_resource_id_when_properties_resource_id_is_triply_percent_encoded_json_reference_scalar()
    {
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = storageId });
        string encodedOnce = Uri.EscapeDataString(referenceJson);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "resourceId": {{JsonSerializer.Serialize(encodedThrice)}}
                },
                "endpointUrl": "https://hooks.example.com/callback"
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationResourceId.Should().Be(storageId);
        destinationHost.Should().Be("hooks.example.com");
    }

    [Fact]
    public void Extract_returns_null_webhook_host_when_top_level_endpoint_url_is_percent_encoded_json_reference_scalar()
    {
        string referenceJson = JsonSerializer.Serialize(new { id = "https://hooks.example.com/callback" });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": {{JsonSerializer.Serialize(encodedReference)}}
              }
            }
            """);

        (
            string destinationKind,
            _,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationHost.Should().BeNull();
        warningCode.Should().Be("eventgrid-webhook-host-only");
    }

    [Fact]
    public void Extract_reads_webhook_destination_resource_id_when_properties_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = storageId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "resourceId": {{JsonSerializer.Serialize(encodedReference)}}
                },
                "endpointUrl": "https://hooks.example.com/callback"
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationResourceId.Should().Be(storageId);
        destinationHost.Should().Be("hooks.example.com");
    }

    [Fact]
    public void Extract_reads_webhook_destination_resource_id_from_nested_properties_object_with_resource_id_key_only()
    {
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "resourceId": {
                    "resourceId": "{{storageId}}"
                  }
                },
                "endpointUrl": "https://hooks.example.com/callback"
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationResourceId.Should().Be(storageId);
        destinationHost.Should().Be("hooks.example.com");
    }

    [Fact]
    public void Extract_reads_azure_function_destination_resource_id_when_properties_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string functionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1/functions/f1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = functionId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "AzureFunction",
                "properties": {
                  "resourceId": {{JsonSerializer.Serialize(encodedReference)}}
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("AzureFunction");
        destinationResourceId.Should().Be(functionId);
    }

    [Fact]
    public void Extract_reads_azure_function_destination_resource_id_from_nested_properties_object_with_resource_id_key_only()
    {
        const string functionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1/functions/Run";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "AzureFunction",
                "properties": {
                  "resourceId": {
                    "resourceId": "{{functionId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("AzureFunction");
        destinationResourceId.Should().Be(functionId);
    }

    [Fact]
    public void Extract_reads_hybrid_connection_destination_resource_id_when_properties_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string hybridId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Relay/namespaces/relay1/hybridConnections/hc1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = hybridId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "HybridConnection",
                "properties": {
                  "resourceId": {{JsonSerializer.Serialize(encodedReference)}}
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("HybridConnection");
        destinationResourceId.Should().Be(hybridId);
    }

    [Fact]
    public void Extract_reads_hybrid_connection_destination_resource_id_from_nested_properties_object_with_resource_id_key_only()
    {
        const string hybridId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Relay/namespaces/relay1/hybridConnections/hc1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "HybridConnection",
                "properties": {
                  "resourceId": {
                    "resourceId": "{{hybridId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("HybridConnection");
        destinationResourceId.Should().Be(hybridId);
    }

    [Fact]
    public void Extract_reads_service_bus_destination_resource_id_from_nested_properties_object_with_resource_id_key_only()
    {
        const string serviceBusId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sb1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusQueue",
                "properties": {
                  "resourceId": {
                    "resourceId": "{{serviceBusId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusQueue");
        destinationResourceId.Should().Be(serviceBusId);
    }

    [Fact]
    public void Extract_does_not_read_storage_queue_properties_queue_name_object_as_destination_arm_id()
    {
        const string queueId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1/queueServices/default/queues/q1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "StorageQueue",
                "properties": {
                  "queueName": {
                    "resourceId": "{{queueId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("StorageQueue");
        destinationResourceId.Should().BeNull();
    }

    [Fact]
    public void Extract_does_not_read_event_hub_properties_resource_group_object_as_destination_arm_id()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "properties": {
                  "resourceGroup": {
                    "resourceId": "{{eventHubId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_service_bus_queue_destination_resource_id_when_top_level_event_hub_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = eventHubId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusQueue",
                "eventHubResourceId": {{JsonSerializer.Serialize(encodedReference)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusQueue");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_service_bus_queue_destination_resource_id_when_properties_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string serviceBusId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sb1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = serviceBusId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusQueue",
                "properties": {
                  "resourceId": {{JsonSerializer.Serialize(encodedReference)}}
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusQueue");
        destinationResourceId.Should().Be(serviceBusId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_when_top_level_event_hub_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";
        string encodedArmId = Uri.EscapeDataString(eventHubId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "eventHubResourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_when_top_level_resource_uri_is_percent_encoded_plain_arm_scalar()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1/eventhubs/hub1";
        string encodedArmId = Uri.EscapeDataString(eventHubId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "resourceUri": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_hybrid_connection_destination_resource_id_when_top_level_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string hybridId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Relay/namespaces/relay1/hybridConnections/hc1";
        string encodedArmId = Uri.EscapeDataString(hybridId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "HybridConnection",
                "resourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("HybridConnection");
        destinationResourceId.Should().Be(hybridId);
    }

    [Fact]
    public void Extract_reads_storage_queue_destination_resource_id_when_top_level_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string queueId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1/queueServices/default/queues/q1";
        string encodedArmId = Uri.EscapeDataString(queueId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "StorageQueue",
                "resourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("StorageQueue");
        destinationResourceId.Should().Be(queueId);
    }

    [Fact]
    public void Extract_reads_service_bus_queue_destination_resource_id_when_top_level_resource_uri_is_percent_encoded_plain_arm_scalar()
    {
        const string queueId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sb1/queues/q1";
        string encodedArmId = Uri.EscapeDataString(queueId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusQueue",
                "resourceUri": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusQueue");
        destinationResourceId.Should().Be(queueId);
    }

    [Fact]
    public void Extract_reads_service_bus_topic_destination_resource_id_when_top_level_resource_uri_is_percent_encoded_plain_arm_scalar()
    {
        const string topicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sb1/topics/topic1";
        string encodedArmId = Uri.EscapeDataString(topicId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusTopic",
                "resourceUri": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusTopic");
        destinationResourceId.Should().Be(topicId);
    }

    [Fact]
    public void Extract_reads_azure_function_destination_resource_id_when_top_level_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string functionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1/functions/Run";
        string encodedArmId = Uri.EscapeDataString(functionId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "AzureFunction",
                "resourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("AzureFunction");
        destinationResourceId.Should().Be(functionId);
    }

    [Fact]
    public void Extract_reads_service_bus_topic_destination_resource_id_when_top_level_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string topicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sb1/topics/topic1";
        string encodedArmId = Uri.EscapeDataString(topicId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "ServiceBusTopic",
                "resourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("ServiceBusTopic");
        destinationResourceId.Should().Be(topicId);
    }

    [Fact]
    public void Extract_reads_partner_destination_resource_id_when_top_level_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string partnerId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/partnerTopics/partner1";
        string encodedArmId = Uri.EscapeDataString(partnerId);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "Partner",
                "resourceId": {{JsonSerializer.Serialize(encodedArmId)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("Partner");
        destinationResourceId.Should().Be(partnerId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_when_top_level_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = eventHubId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "resourceId": {{JsonSerializer.Serialize(encodedReference)}}
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_when_properties_event_hub_resource_id_is_percent_encoded_json_reference_scalar()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = eventHubId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "properties": {
                  "eventHubResourceId": {{JsonSerializer.Serialize(encodedReference)}}
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_from_nested_properties_event_hub_resource_id_object()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "properties": {
                  "eventHubResourceId": {
                    "resourceId": "{{eventHubId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_from_nested_properties_object_with_resource_id_key_only()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "properties": {
                  "resourceId": {
                    "resourceId": "{{eventHubId}}"
                  }
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_from_object_with_resource_id_key_only()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "resourceId": {
                  "resourceId": "{{eventHubId}}"
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_event_hub_destination_resource_id_from_percent_encoded_json_reference_scalar_with_resource_id_key_only()
    {
        const string eventHubId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1";

        string referenceJson = JsonSerializer.Serialize(new { resourceId = eventHubId });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "EventHub",
                "resourceId": "{{encodedReference}}"
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("EventHub");
        destinationResourceId.Should().Be(eventHubId);
    }

    [Fact]
    public void Extract_reads_storage_queue_resource_id_from_nested_destination_properties()
    {
        const string storageAccountId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "StorageQueue",
                "properties": {
                  "resourceId": "{{storageAccountId}}",
                  "queueName": "orders"
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("StorageQueue");
        destinationResourceId.Should().Be(storageAccountId);
        destinationHost.Should().BeNull();
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_nested_destination_properties()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "endpointUrl": "https://hooks.example.com/a?token=x"
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_when_endpoint_url_omits_scheme()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "endpointUrl": "hooks.example.com/a?token=x"
                }
              }
            }
            """);

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationKind.Should().Be("WebHook");
        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_percent_encoded_endpoint_base_url_when_endpoint_url_is_whitespace()
    {
        string encodedBaseUrl = Uri.EscapeDataString("hooks.example.com/callback?token=x");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
              {
                "destination": {
                  "endpointType": "WebHook",
                  "endpointUrl": "   ",
                  "endpointBaseUrl": "{{encodedBaseUrl}}"
                }
              }
              """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_endpoint_url_when_endpoint_base_url_has_longer_path()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "hooks.example.com/short",
                "endpointBaseUrl": "hooks.example.com/tenant/long/path?token=x"
              }
            }
            """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_percent_encoded_endpoint_base_url_when_endpoint_url_does_not_yield_host()
    {
        string encodedPrimary = Uri.EscapeDataString("%20");
        string encodedBaseUrl = Uri.EscapeDataString("hooks.example.com/callback?token=x");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "{{encodedPrimary}}",
                "endpointBaseUrl": "{{encodedBaseUrl}}"
              }
            }
            """);

        (
            _,
            _,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationHost.Should().Be("hooks.example.com");
    }

    [Fact]
    public void Extract_reads_webhook_host_from_percent_encoded_endpoint_url_when_endpoint_base_url_missing()
    {
        string encodedUrl = Uri.EscapeDataString("https://hooks.example.com/callback?token=x");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "{{encodedUrl}}"
              }
            }
            """);

        (
            _,
            _,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationHost.Should().Be("hooks.example.com");
    }

    [Fact]
    public void Extract_reads_webhook_host_from_endpoint_url_when_endpoint_base_url_is_percent_encoded()
    {
        string encodedBaseUrl = Uri.EscapeDataString("fallback.example.com/path?token=x");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "https://primary.example.com/callback",
                "endpointBaseUrl": "{{encodedBaseUrl}}"
              }
            }
            """);

        (
            _,
            _,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationHost.Should().Be("primary.example.com");
    }

    [Fact]
    public void Extract_reads_webhook_host_from_endpoint_url_when_endpoint_base_url_has_different_host()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "https://primary.example.com/callback",
                "endpointBaseUrl": "fallback.example.com/path"
              }
            }
            """);

        (
            _,
            _,
            string? destinationHost,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationHost.Should().Be("primary.example.com");
    }

    [Fact]
    public void Extract_reads_webhook_host_from_endpoint_base_url_when_endpoint_url_is_percent_encoded_whitespace_only()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "%20%20",
                "endpointBaseUrl": "hooks.example.com/a?token=x"
              }
            }
            """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_endpoint_base_url_when_endpoint_url_does_not_yield_host()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "endpointUrl": "%20",
                "endpointBaseUrl": "hooks.example.com/a?token=x"
              }
            }
            """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_from_percent_encoded_endpoint_base_url_when_scheme_omitted()
    {
        string encodedBaseUrl = Uri.EscapeDataString("hooks.example.com%252Fpath?token=x");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
              {
                "destination": {
                  "endpointType": "WebHook",
                  "endpointBaseUrl": "{{encodedBaseUrl}}"
                }
              }
              """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }

    [Fact]
    public void Extract_reads_webhook_host_when_only_endpoint_base_url_omits_scheme()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "destination": {
                "endpointType": "WebHook",
                "properties": {
                  "endpointBaseUrl": "hooks.example.com/a?token=x"
                }
              }
            }
            """);

        (
            _,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().BeNull();
        destinationHost.Should().Be("hooks.example.com");
        warningCode.Should().BeNull();
    }
}
