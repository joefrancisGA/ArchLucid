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
    public void Expand_persists_bastion_ip_configuration_subnet_id()
    {
        const string json = """
            {
              "ipConfigurations": [
                {
                  "properties": {
                    "subnet": {
                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureBastionSubnet"
                    }
                  }
                }
              ]
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/bastionHosts",
            document.RootElement,
            []);

        Assert.Equal(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureBastionSubnet",
            properties["ipConfiguration.subnet.id"]);
        Assert.Equal(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureBastionSubnet",
            properties["ipConfiguration.subnet.id[0]"]);
    }

    [Fact]
    public void Expand_persists_firewall_ip_configuration_and_management_subnet_ids()
    {
        const string dataSubnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureFirewallSubnet";
        const string managementSubnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureFirewallManagementSubnet";
        const string json = """
            {
              "ipConfigurations": [
                {
                  "properties": {
                    "subnet": {
                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureFirewallSubnet"
                    }
                  }
                }
              ],
              "managementIpConfiguration": {
                "properties": {
                  "subnet": {
                    "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/AzureFirewallManagementSubnet"
                  }
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/azureFirewalls",
            document.RootElement,
            []);

        Assert.Contains(dataSubnetId, properties["ipConfigurations"]?.ToString(), StringComparison.Ordinal);
        Assert.Equal(dataSubnetId, properties["ipConfiguration.subnet.id[0]"]);
        Assert.Equal(managementSubnetId, properties["managementIpConfiguration.subnet.id"]);
    }

    [Fact]
    public void Expand_does_not_invent_a_firewall_subnet_id()
    {
        const string json = """
            {
              "ipConfigurations": []
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/azureFirewalls",
            document.RootElement,
            []);

        Assert.DoesNotContain(
            properties.Keys,
            key => key.StartsWith("ipConfiguration.subnet.id", StringComparison.OrdinalIgnoreCase)
                   || key.Equals("managementIpConfiguration.subnet.id", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(
            properties.Values.Select(value => value?.ToString()),
            value => value?.Contains("AzureFirewallSubnet", StringComparison.OrdinalIgnoreCase) == true);
    }

    [Fact]
    public void Expand_persists_container_registry_login_server()
    {
        const string json = """
            {
              "loginServer": "acraephidevwus001.azurecr.io",
              "adminUserEnabled": false
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.ContainerRegistry/registries",
            document.RootElement,
            []);

        Assert.Equal("acraephidevwus001.azurecr.io", properties["loginServer"]);
        Assert.DoesNotContain(properties.Keys, key => key.Contains("password", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Expand_persists_container_and_init_container_images()
    {
        const string json = """
            {
              "template": {
                "containers": [
                  {
                    "image": "acraephidevwus001.azurecr.io/app-one:1"
                  },
                  {
                    "image": "acraephidevwus001.azurecr.io/app-two:2"
                  }
                ],
                "initContainers": [
                  {
                    "image": "acraephidevwus001.azurecr.io/init:3"
                  }
                ],
                "env": [
                  {
                    "name": "SECRET",
                    "value": "do-not-store"
                  }
                ]
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.App/containerApps",
            document.RootElement,
            []);

        Assert.Equal("acraephidevwus001.azurecr.io/app-one:1", properties["container.image[0]"]);
        Assert.Equal("acraephidevwus001.azurecr.io/app-two:2", properties["container.image[1]"]);
        Assert.Equal("acraephidevwus001.azurecr.io/init:3", properties["container.image[2]"]);
        Assert.DoesNotContain(
            properties.Values,
            value => value?.ToString()?.Contains("do-not-store", StringComparison.Ordinal) == true);
    }

    [Fact]
    public void Expand_persists_only_docker_web_app_images()
    {
        const string dockerJson = """
            {
              "siteConfig": {
                "linuxFxVersion": "DOCKER|acraephidevwus001.azurecr.io/app:1"
              }
            }
            """;
        const string runtimeJson = """
            {
              "siteConfig": {
                "linuxFxVersion": "DOTNET|8.0"
              }
            }
            """;

        using JsonDocument dockerDocument = JsonDocument.Parse(dockerJson);
        using JsonDocument runtimeDocument = JsonDocument.Parse(runtimeJson);
        Dictionary<string, object?> dockerProperties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Web/sites",
            dockerDocument.RootElement,
            []);
        Dictionary<string, object?> runtimeProperties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Web/sites",
            runtimeDocument.RootElement,
            []);

        Assert.Equal("acraephidevwus001.azurecr.io/app:1", dockerProperties["container.image[0]"]);
        Assert.DoesNotContain("container.image[0]", runtimeProperties.Keys);
    }

    [Fact]
    public void Expand_persists_restore_point_collection_source_id()
    {
        const string sourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        string json = $$"""
            {
              "source": {
                "id": "{{sourceId}}"
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Compute/restorePointCollections",
            document.RootElement,
            []);

        Assert.Equal(sourceId, properties["source.id"]);
    }

    [Fact]
    public void Expand_does_not_invent_restore_point_collection_source_id()
    {
        using JsonDocument document = JsonDocument.Parse("{}");
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Compute/restorePointCollections",
            document.RootElement,
            []);

        Assert.DoesNotContain("source.id", properties.Keys);
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
