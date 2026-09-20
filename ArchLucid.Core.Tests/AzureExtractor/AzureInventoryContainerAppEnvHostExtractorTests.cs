using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryContainerAppEnvHostExtractorTests
{
    [Fact]
    public void ExtractRows_emits_host_row_without_connection_string_value()
    {
        const string containerAppId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1";

        string json = """
                      {
                        "properties": {
                          "template": {
                            "containers": [
                              {
                                "name": "app",
                                "env": [
                                  {
                                    "name": "ConnectionStrings__ArchLucid",
                                    "value": "Server=tcp:sql1.database.windows.net,1433;Initial Catalog=archlucid;"
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        IReadOnlyList<AzureInventoryAppSettingHostRow> rows =
            AzureInventoryContainerAppEnvHostExtractor.ExtractRows(containerAppId, document.RootElement);

        rows.Should().ContainSingle();
        rows[0].SiteResourceId.Should().Be(containerAppId);
        rows[0].SettingName.Should().Be("ConnectionStrings__ArchLucid");
        rows[0].Host.Should().Be("sql1.database.windows.net");
        rows[0].Catalog.Should().Be("archlucid");
        JsonSerializer.Serialize(rows[0]).Should().NotContain("1433");
    }

    [Fact]
    public void ExtractRows_emits_secret_ref_name_only()
    {
        const string containerAppId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1";

        string json = """
                      {
                        "properties": {
                          "template": {
                            "containers": [
                              {
                                "name": "app",
                                "env": [
                                  {
                                    "name": "ConnectionStrings__ArchLucid",
                                    "secretRef": "al-cs-key"
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        IReadOnlyList<AzureInventoryAppSettingHostRow> rows =
            AzureInventoryContainerAppEnvHostExtractor.ExtractRows(containerAppId, document.RootElement);

        rows.Should().ContainSingle();
        rows[0].SecretRef.Should().Be("al-cs-key");
        rows[0].Host.Should().BeNull();
    }
}
