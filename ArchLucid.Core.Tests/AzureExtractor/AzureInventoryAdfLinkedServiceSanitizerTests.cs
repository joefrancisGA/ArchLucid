using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceSanitizerTests
{
    private const string FactoryId =
        "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void TrySanitizeFromArmResource_extracts_blob_host_without_connection_string()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/BlobLS",
              "name": "BlobLS",
              "properties": {
                "type": "AzureBlobStorage",
                "typeProperties": {
                  "connectionString": { "type": "SecureString", "value": "DefaultEndpointsProtocol=https;AccountName=secret;" },
                  "serviceEndpoint": "https://sa1.blob.core.windows.net/"
                },
                "connectVia": { "referenceName": "AutoResolveIntegrationRuntime", "type": "IntegrationRuntimeReference" }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().Be("sa1.blob.core.windows.net");
        row.IntegrationRuntimeName.Should().Be("AutoResolveIntegrationRuntime");
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
    }

    [Fact]
    public void TrySanitizeFromArmResource_marks_unsupported_connector()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/RestLS",
              "name": "RestLS",
              "properties": { "type": "RestService", "typeProperties": { "url": "https://example.com" } }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.UnsupportedConnector);
    }

    [Fact]
    public void TrySanitizeFromArmResource_extracts_explicit_arm_target()
    {
        const string storageId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        JsonElement linkedService = JsonDocument.Parse(
            $$"""
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/BlobLS",
              "name": "BlobLS",
              "properties": {
                "type": "AzureBlobStorage",
                "typeProperties": { "serviceEndpoint": "{{storageId}}" }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetResourceId.Should().Be(storageId);
    }
}
