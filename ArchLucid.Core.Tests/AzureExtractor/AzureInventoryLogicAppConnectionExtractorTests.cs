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
}
