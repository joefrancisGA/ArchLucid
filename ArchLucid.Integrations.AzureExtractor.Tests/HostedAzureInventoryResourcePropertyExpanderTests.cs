using System.Text.Json;

using ArchLucid.Integrations.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureInventoryResourcePropertyExpanderTests
{
    [Theory]
    [InlineData("Microsoft.EventGrid/topics")]
    [InlineData("Microsoft.EventGrid/domains")]
    public void Expand_captures_explicit_event_grid_security_properties(string resourceType)
    {
        using JsonDocument document = JsonDocument.Parse("""
            {"disableLocalAuth":true,"publicNetworkAccess":"Disabled","privateEndpointConnections":[]}
            """);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            resourceType, document.RootElement, []);
        Assert.Equal(true, properties["disableLocalAuth"]);
        Assert.Equal("Disabled", properties["publicNetworkAccess"]);
        Assert.Equal("[]", properties["privateEndpointConnections"]);
    }

    [Fact]
    public void Expand_does_not_invent_event_grid_security_defaults()
    {
        using JsonDocument document = JsonDocument.Parse("{}");
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.EventGrid/topics", document.RootElement, []);
        Assert.False(properties.ContainsKey("disableLocalAuth"));
        Assert.False(properties.ContainsKey("publicNetworkAccess"));
    }

    [Fact]
    public void Expand_preserves_nic_ip_configuration_subnet_index_when_earlier_slot_has_no_properties()
    {
        const string subnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/b";
        const string json = """
            {
              "ipConfigurations": [
                {},
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

        Assert.Equal(subnetId, properties["ipConfiguration.subnet.id[1]"]);
        Assert.False(properties.ContainsKey("ipConfiguration.subnet.id[0]"));
    }

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

    [Theory]
    [InlineData("Microsoft.Web/sites")]
    [InlineData("Microsoft.Web/sites/slots")]
    public void Expand_captures_runtime_configuration_without_claiming_observation(string resourceType)
    {
        using JsonDocument document = JsonDocument.Parse("""
            {"siteConfig":{"linuxFxVersion":" JAVA|17 ","javaVersion":"17",
            "javaContainer":"TOMCAT","javaContainerVersion":"10.1",
            "appSettings":[{"name":"SECRET","value":"do-not-store"}]}}
            """);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            resourceType, document.RootElement, []);

        Assert.Equal("JAVA|17", properties["runtime.configured.linuxFxVersion"]);
        Assert.Equal("17", properties["runtime.configured.javaVersion"]);
        Assert.Equal("TOMCAT", properties["runtime.configured.javaContainer"]);
        Assert.Equal("10.1", properties["runtime.configured.javaContainerVersion"]);
        Assert.All(properties.Keys.Where(key => key.StartsWith("runtime.", StringComparison.Ordinal)),
            key => Assert.StartsWith("runtime.configured.", key));
        Assert.DoesNotContain(properties.Values,
            value => value?.ToString()?.Contains("do-not-store", StringComparison.Ordinal) == true);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"siteConfig\":null}")]
    [InlineData("{\"siteConfig\":{\"javaVersion\":17,\"nodeVersion\":\" \"}}")]
    [InlineData("{\"siteConfig\":{\"linuxFxVersion\":\"DOCKER|registry.example/app:1\"}}")]
    public void Expand_does_not_invent_runtime_configuration_or_observation(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Web/sites", document.RootElement, []);
        Assert.DoesNotContain(properties.Keys, key => key.StartsWith("runtime.", StringComparison.Ordinal));
    }

    [Fact]
    public void Expand_captures_windows_stack_configuration_only()
    {
        using JsonDocument document = JsonDocument.Parse("""
            {"siteConfig":{"windowsFxVersion":"JAVA|17","netFrameworkVersion":"v8.0","nodeVersion":"~22"}}
            """);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Web/sites", document.RootElement, []);
        Assert.Equal("JAVA|17", properties["runtime.configured.windowsFxVersion"]);
        Assert.Equal("v8.0", properties["runtime.configured.netFrameworkVersion"]);
        Assert.Equal("~22", properties["runtime.configured.nodeVersion"]);
        Assert.DoesNotContain("runtime.executing.version", properties.Keys);
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
    public void Expand_stores_node_resource_group_on_managed_cluster()
    {
        const string json = """
            {
              "nodeResourceGroup": "MC_rg_aks_westus",
              "agentPoolProfiles": []
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.ContainerService/managedClusters",
            document.RootElement,
            []);

        Assert.Equal("MC_rg_aks_westus", properties["nodeResourceGroup"]);
    }

    [Fact]
    public void Expand_preserves_vmss_ip_configuration_subnet_index_when_earlier_slot_has_no_subnet()
    {
        const string subnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/workers";
        const string json = """
            {
              "virtualMachineProfile": {
                "networkProfile": {
                  "networkInterfaceConfigurations": [
                    {
                      "properties": {
                        "ipConfigurations": [
                          {
                            "properties": {}
                          },
                          {
                            "properties": {
                              "subnet": {
                                "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/workers"
                              }
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Compute/virtualMachineScaleSets",
            document.RootElement,
            []);

        Assert.Equal(subnetId, properties["ipConfiguration.subnet.id[1]"]);
        Assert.False(properties.ContainsKey("ipConfiguration.subnet.id[0]"));
    }

    [Fact]
    public void Expand_orders_vm_network_interface_pipe_delimited_ids_by_numeric_index()
    {
        const string nicAt2 =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-2";
        const string nicAt10 =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-10";
        string json = """
            {
              "networkProfile": {
                "networkInterfaces": [
            """ + string.Join(",", Enumerable.Range(0, 11).Select(i =>
            i == 2
                ? $$"""{ "id": "{{nicAt2}}" }"""
                : i == 10
                    ? $$"""{ "id": "{{nicAt10}}" }"""
                    : """{ "properties": {} }""")) + """
                ]
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Compute/virtualMachines",
            document.RootElement,
            []);

        Assert.Equal($"{nicAt2}|{nicAt10}", properties["networkProfile.networkInterfaces"]);
    }

    [Fact]
    public void Expand_preserves_vm_network_profile_network_interface_index_when_earlier_slot_has_no_id()
    {
        const string nicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-b";
        const string json = """
            {
              "networkProfile": {
                "networkInterfaces": [
                  {
                    "properties": {}
                  },
                  {
                    "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-b"
                  }
                ]
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Compute/virtualMachines",
            document.RootElement,
            []);

        Assert.Equal(nicId, properties["networkProfile.networkInterfaces[1]"]);
        Assert.False(properties.ContainsKey("networkProfile.networkInterfaces[0]"));
        Assert.Equal(nicId, properties["networkProfile.networkInterfaces"]);
    }

    [Fact]
    public void Expand_preserves_private_endpoint_network_interface_index_when_earlier_slot_has_no_id()
    {
        const string nicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic";
        const string json = """
            {
              "networkInterfaces": [
                {
                  "properties": {}
                },
                {
                  "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic"
                }
              ]
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/privateEndpoints",
            document.RootElement,
            []);

        Assert.Equal(nicId, properties["networkInterfaces[1]"]);
        Assert.False(properties.ContainsKey("networkInterfaces[0]"));
        Assert.Equal(nicId, properties["networkInterfaces"]);
    }

    [Fact]
    public void Expand_preserves_private_link_service_id_index_when_earlier_connection_has_no_target()
    {
        const string targetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string json = """
            {
              "privateLinkServiceConnections": [
                {
                  "properties": {}
                },
                {
                  "properties": {
                    "privateLinkServiceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1"
                  }
                }
              ]
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/privateEndpoints",
            document.RootElement,
            []);

        Assert.Equal(targetId, properties["privateLinkServiceId[1]"]);
        Assert.False(properties.ContainsKey("privateLinkServiceId[0]"));
        Assert.Equal(targetId, properties["privateLinkServiceId"]);
    }

    [Fact]
    public void Expand_persists_every_private_link_service_id_across_connection_arrays()
    {
        const string automaticTarget =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string manualTarget =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string json = """
            {
              "privateLinkServiceConnections": [
                {
                  "properties": {
                    "privateLinkServiceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1"
                  }
                }
              ],
              "manualPrivateLinkServiceConnections": [
                {
                  "properties": {
                    "privateLinkServiceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1"
                  }
                }
              ]
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        Dictionary<string, object?> properties = HostedAzureInventoryResourcePropertyExpander.Expand(
            "Microsoft.Network/privateEndpoints",
            document.RootElement,
            []);

        Assert.Equal(automaticTarget, properties["privateLinkServiceId[0]"]);
        Assert.Equal(manualTarget, properties["privateLinkServiceId[1]"]);
        Assert.Equal(automaticTarget, properties["privateLinkServiceId"]);
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
