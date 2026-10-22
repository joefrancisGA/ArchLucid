using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridDestinationExtractorTests
{
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
}
