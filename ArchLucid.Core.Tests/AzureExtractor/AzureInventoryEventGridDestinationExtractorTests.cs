using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridDestinationExtractorTests
{
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
