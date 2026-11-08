using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Suite", "Core")]
public sealed class AzureInventoryLogicAppConnectionExtractorTests
{
    [Fact]
    public void ExtractFromWorkflow_unwraps_connections_value_object()
    {
        const string workflowId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";
        const string connectionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365";
        string json = """
            {
              "properties": {
                "parameters": {
                  "$connections": {
                    "value": {
                      "office365": {
                        "connectionId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
                        "id": "/subscriptions/sub/providers/Microsoft.Web/locations/eastus/managedApis/office365"
                      }
                    }
                  }
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        IReadOnlyList<AzureInventoryLogicAppConnectionRow> rows =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWorkflow(workflowId, "notify", document.RootElement);

        rows.Should().ContainSingle(row =>
            row.ConnectionName == "office365"
            && row.ConnectionResourceId == connectionId);
    }

    [Fact]
    public void ExtractFromWorkflow_collects_allowed_action_resource_ids_without_secrets()
    {
        const string workflowId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        string json = $$"""
            {
              "properties": {
                "definition": {
                  "actions": {
                    "RunFactory": {
                      "inputs": {
                        "uri": "{{factoryId}}"
                      },
                      "secret": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/secret"
                    },
                    "Expression": {
                      "inputs": {
                        "uri": "@parameters('factoryId')"
                      }
                    }
                  }
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        IReadOnlyList<AzureInventoryLogicAppConnectionRow> rows =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWorkflow(
                workflowId,
                "notify",
                document.RootElement);

        rows.Should().ContainSingle(row =>
            row.ConnectionName == "RunFactory"
            && row.ConnectionResourceId == factoryId);
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_percent_encoded_https_url_has_trailing_dot_hostname()
    {
        string apiId = Uri.EscapeDataString("https://contoso.logic.azure.com./workflows/w");

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_is_doubly_percent_encoded_https_url()
    {
        string apiId = Uri.EscapeDataString(Uri.EscapeDataString("https://contoso.logic.azure.com/workflows/w"));

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_is_scheme_less_host_with_percent_encoded_path()
    {
        string apiId = "contoso.logic.azure.com" + Uri.EscapeDataString("/workflows/w");

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_is_percent_encoded_https_url()
    {
        string apiId = Uri.EscapeDataString("https://contoso.logic.azure.com/workflows/w");

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_omits_https_scheme()
    {
        const string connectionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365";

        string json = """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "management.azure.com/subscriptions/sub/providers/Microsoft.Web/locations/eastus/managedApis/office365"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.ConnectionResourceId.Should().Be(connectionId);
        row.TargetHost.Should().Be("management.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_is_percent_encoded_https_url_with_uppercase_host()
    {
        string apiId = Uri.EscapeDataString("HTTPS://CONTOSO.LOGIC.AZURE.COM/workflows/w");

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_reads_target_host_when_api_id_is_doubly_percent_encoded_scheme_less_host_with_path()
    {
        string apiId = Uri.EscapeDataString(Uri.EscapeDataString("contoso.logic.azure.com/workflows/w"));

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().Be("contoso.logic.azure.com");
    }

    [Fact]
    public void ExtractFromWebConnection_leaves_target_host_null_when_api_id_is_percent_encoded_arm_path_without_hostname()
    {
        string apiId = Uri.EscapeDataString(
            "/subscriptions/sub/providers/Microsoft.Web/locations/eastus/managedApis/office365");

        string json = $$"""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "{{apiId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().BeNull();
    }

    [Fact]
    public void ExtractFromWebConnection_leaves_target_host_null_when_api_id_is_arm_path_without_hostname()
    {
        string json = """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365",
              "name": "office365",
              "properties": {
                "apiId": "/subscriptions/sub/providers/Microsoft.Web/locations/eastus/managedApis/office365"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryLogicAppConnectionRow? row =
            AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(document.RootElement);

        row.Should().NotBeNull();
        row!.TargetHost.Should().BeNull();
    }
}
