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
    public void TrySanitizeFromArmResource_extracts_mysql_host_from_connection_string_without_retaining_it()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/MySqlLS",
              "name": "MySqlLS",
              "properties": {
                "type": "AzureMySql",
                "typeProperties": {
                  "connectionString": "Server=mysql-edw.mysql.database.azure.com,3306;Database=app;Pwd=secret"
                }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(
                FactoryId,
                linkedService,
                out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().Be("mysql-edw.mysql.database.azure.com");
        row.HostInKeyVault.Should().BeFalse();
        row.ToString().Should().NotContain("Pwd");
        row.ToString().Should().NotContain("secret");
    }

    [Fact]
    public void TrySanitizeFromArmResource_marks_mysql_key_vault_server_without_guessing_a_host()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/MySqlSecretLS",
              "name": "MySqlSecretLS",
              "properties": {
                "type": "AzureMySql",
                "typeProperties": {
                  "server": { "type": "AzureKeyVaultSecret", "store": { "referenceName": "kv1" }, "secretName": "mysql-host" }
                }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(
                FactoryId,
                linkedService,
                out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().BeNull();
        row.HostInKeyVault.Should().BeTrue();
        row.ToString().Should().NotContain("mysql-host");
    }

    [Fact]
    public void TrySanitizeFromArmResource_does_not_read_sql_connection_string()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/SqlLS",
              "name": "SqlLS",
              "properties": {
                "type": "AzureSqlDatabase",
                "typeProperties": {
                  "connectionString": "Server=sql1.database.windows.net;Pwd=secret"
                }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(
                FactoryId,
                linkedService,
                out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().BeNull();
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved);
    }

    [Fact]
    public void TrySanitizeFromArmResource_extracts_rest_service_host()
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

        row!.TargetHost.Should().Be("example.com");
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
    }

    [Fact]
    public void TrySanitizeFromArmResource_extracts_cosmos_host()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/CosmosLS",
              "name": "CosmosLS",
              "properties": {
                "type": "CosmosDb",
                "typeProperties": { "accountEndpoint": "https://cosmos1.documents.azure.com:443/" }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().Be("cosmos1.documents.azure.com");
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
    }

    [Fact]
    public void TrySanitizeFromArmResource_marks_sap_table_without_host_as_target_unresolved()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/SapLS",
              "name": "SapLS",
              "properties": { "type": "SapTable", "typeProperties": { "systemNumber": "00" } }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved);
    }

    [Fact]
    public void TrySanitizeFromArmResource_marks_unsupported_connector()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/CustomLS",
              "name": "CustomLS",
              "properties": { "type": "CustomConnector", "typeProperties": { } }
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

    [Fact]
    public void TrySanitizeFromArmResource_marks_blob_linked_service_unresolved_when_service_endpoint_is_json_object()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/BlobLS",
              "name": "BlobLS",
              "properties": {
                "type": "AzureBlobStorage",
                "typeProperties": {
                  "serviceEndpoint": {
                    "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1"
                  }
                }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetResourceId.Should().BeNull();
        row.TargetHost.Should().BeNull();
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved);
    }

    [Fact]
    public void TrySanitizeFromArmResource_leaves_key_vault_resource_id_null_when_base_url_resolves()
    {
        JsonElement linkedService = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/KvLS",
              "name": "KvLS",
              "properties": {
                "type": "AzureKeyVault",
                "typeProperties": { "baseUrl": "https://kv1.vault.azure.net/" }
              }
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(FactoryId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
            .Should().BeTrue();

        row!.TargetHost.Should().Be("kv1.vault.azure.net");
        row.KeyVaultResourceId.Should().BeNull();
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
    }
}
