using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

/// <summary>
///     Flat vs nested <c>properties</c> bag shapes for extractors that read child ARM objects.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryArmNestedObjectPropertyMatrixTests
{
    private const string StorageAccountId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

    private const string SqlServerId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

    private const string NamespaceId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";

    private const string EventHubNamespaceDestinationId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";

    public static TheoryData<string, string> EventGridDestinationResourceIdShapes =>
        new()
        {
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "StorageQueue",
                    "resourceId": "{{StorageAccountId}}"
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "StorageQueue",
                    "resourceId": "{{Uri.EscapeDataString(Uri.EscapeDataString(StorageAccountId))}}"
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "StorageQueue",
                    "resourceId": {{JsonSerializer.Serialize("\"" + StorageAccountId + "\"")}}
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "StorageQueue",
                    "properties": {
                      "resourceId": "{{StorageAccountId}}",
                      "queueName": "orders"
                    }
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "StorageQueue",
                    "resourceId": {
                      "id": "{{StorageAccountId}}"
                    }
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "AzureFunction",
                    "properties": {
                      "resourceId": {{JsonSerializer.Serialize(JsonSerializer.Serialize(new { id = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1/functions/func1" }))}}
                    }
                  }
                }
                """,
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1/functions/func1"
            },
            {
                $$"""
                {
                  "destination": {
                    "endpointType": "EventHub",
                    "resourceId": {{JsonSerializer.Serialize(JsonSerializer.Serialize(new { id = "\"" + EventHubNamespaceDestinationId + "\"" }))}}
                  }
                }
                """,
                EventHubNamespaceDestinationId
            },
        };

    [Theory]
    [MemberData(nameof(EventGridDestinationResourceIdShapes))]
    public void EventGrid_destination_resource_id_accepts_flat_and_nested_shapes(string json, string expectedResourceId)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        (
            string destinationKind,
            string? destinationResourceId,
            _,
            _) = AzureInventoryEventGridDestinationExtractor.Extract(document.RootElement);

        destinationResourceId.Should().Be(expectedResourceId);
        destinationKind.Should().NotBeNullOrWhiteSpace();
    }

    public static TheoryData<string, string> EventHubCaptureStorageShapes =>
        new()
        {
            {
                $$"""
                {
                  "id": "{{NamespaceId}}/eventhubs/orders",
                  "name": "orders",
                  "properties": {
                    "captureDescription": {
                      "destination": {
                        "storageAccountResourceId": "{{StorageAccountId}}"
                      }
                    }
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "id": "{{NamespaceId}}/eventhubs/orders",
                  "name": "orders",
                  "properties": {
                    "captureDescription": {
                      "enabled": true,
                      "destination": {
                        "name": "EventHubCaptureDestination",
                        "properties": {
                          "storageAccountResourceId": "{{StorageAccountId}}"
                        }
                      }
                    }
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "id": "{{NamespaceId}}/eventhubs/orders",
                  "name": "orders",
                  "properties": {
                    "captureDescription": {
                      "enabled": true,
                      "destination": {
                        "properties": {
                          "storageAccountResourceId": {
                            "id": "{{StorageAccountId}}"
                          }
                        }
                      }
                    }
                  }
                }
                """,
                StorageAccountId
            },
            {
                $$"""
                {
                  "id": "{{NamespaceId}}/eventhubs/orders",
                  "name": "orders",
                  "properties": {
                    "captureDescription": {
                      "destination": {
                        "properties": {
                          "storageAccountResourceId": {
                            "Id": "{{StorageAccountId}}"
                          }
                        }
                      }
                    }
                  }
                }
                """,
                StorageAccountId
            },
        };

    [Theory]
    [MemberData(nameof(EventHubCaptureStorageShapes))]
    public void EventHub_capture_storage_accepts_flat_and_nested_destination_shapes(string json, string expectedStorageId)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        bool extracted = AzureInventoryMessagingAssociationExtractor.TryExtractEventHub(
            NamespaceId,
            document.RootElement,
            out AzureInventoryMessagingAssociationRow? row);

        extracted.Should().BeTrue();
        row!.CaptureStorageAccountId.Should().Be(expectedStorageId);
    }

    public static TheoryData<string, string> ServiceConnectorTargetIdShapes =>
        new()
        {
            {
                $$"""
                {
                  "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1/providers/Microsoft.ServiceLinker/linkers/sql-link",
                  "name": "sql-link",
                  "properties": {
                    "targetService": {
                      "id": "{{SqlServerId}}"
                    }
                  }
                }
                """,
                SqlServerId
            },
            {
                $$"""
                {
                  "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1/providers/Microsoft.ServiceLinker/linkers/sql-link",
                  "name": "sql-link",
                  "properties": {
                    "targetService": {
                      "type": "AzureResource",
                      "properties": {
                        "id": "{{SqlServerId}}"
                      }
                    }
                  }
                }
                """,
                SqlServerId
            },
        };

    [Theory]
    [MemberData(nameof(ServiceConnectorTargetIdShapes))]
    public void ServiceConnector_target_service_accepts_flat_and_nested_shapes(string json, string expectedTargetId)
    {
        const string sourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        using JsonDocument document = JsonDocument.Parse(json);

        bool extracted = AzureInventoryServiceConnectorLinkExtractor.TryExtract(
            sourceId,
            document.RootElement,
            out AzureInventoryServiceConnectorLinkRow? row);

        extracted.Should().BeTrue();
        row!.TargetResourceId.Should().Be(expectedTargetId);
    }
}
