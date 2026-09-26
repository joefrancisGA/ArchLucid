using System.Text.Json;

using ArchLucid.Integrations.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureInventoryResourcePropertyExpanderTests
{
    [Fact]
    public void Expand_persists_every_nic_ip_configuration_subnet_id()
    {
        const string json = """
            {
              "ipConfigurations": [
                {
                  "properties": {
                    "subnet": {
                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/a"
                    }
                  }
                },
                {
                  "properties": {
                    "subnet": {
                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/b"
                    }
                  }
                }
              ]
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/networkInterfaces",
            document.RootElement,
            []);

        Assert.Equal(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/a",
            properties["ipConfiguration.subnet.id[0]"]);
        Assert.Equal(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/b",
            properties["ipConfiguration.subnet.id[1]"]);
    }

    [Fact]
    public void Expand_persists_standard_logic_app_site_connection_parameters()
    {
        const string json = """
            {
              "kind": "functionapp,workflowapp",
              "parameters": {
                "$connections": {
                  "value": {
                    "office365": {
                      "connectionId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365"
                    }
                  }
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Web/sites",
            document.RootElement,
            []);

        Assert.True(properties.ContainsKey("parameters.$connections.value"));
        Assert.Contains("office365", $"{properties["parameters.$connections.value"]}", StringComparison.Ordinal);
    }
}
