using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryLoadBalancerBackendTrafficResolverTests
{
    private const string NicIpConfigurationId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";

    private const string NicId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";

    private const string PoolId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb1/backendAddressPools/pool1";

    [Fact]
    public void ResolveLoadBalancerBackends_reads_ip_configuration_from_backend_addresses()
    {
        // Standard load balancers publish IP-based pool members on loadBalancerBackendAddresses.
        // NIC-based pools still use backendIPConfigurations. Both point at an ipConfigurations id.
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendPort": 443,
                          "backendAddressPool": { "id": "{{PoolId}}" }
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_pool_uses_pascal_case_properties_bag()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "Properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendPort": 443,
                          "backendAddressPool": { "id": "{{PoolId}}" }
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
        targets[0].RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_pools_json_is_string_scalar_wrapping_array()
    {
        string innerPools =
            $$"""
            [
              {
                "id": "{{PoolId}}",
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {
                      "name": "addr1",
                      "properties": {
                        "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                      }
                    }
                  ]
                }
              }
            ]
            """;

        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] = JsonSerializer.Serialize(innerPools),
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendPort": 443,
                          "backendAddressPool": { "id": "{{PoolId}}" }
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
        targets[0].RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_backend_ip_configuration_is_string_scalar_arm_id()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "backendIPConfigurations": [
                            "{{NicIpConfigurationId}}"
                          ]
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_backend_address_row_is_flat_without_properties_wrapper()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                            }
                          ]
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_pool_is_flat_properties_bag_without_wrapper()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "loadBalancerBackendAddresses": [
                          {
                            "name": "addr1",
                            "properties": {
                              "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                            }
                          }
                        ]
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_pools_json_is_single_pool_object()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    {
                      "id": "{{PoolId}}",
                      "properties": {
                        "loadBalancerBackendAddresses": [
                          {
                            "name": "addr1",
                            "properties": {
                              "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                            }
                          }
                        ]
                      }
                    }
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendPort": 443,
                          "backendAddressPool": { "id": "{{PoolId}}" }
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_rule_port_when_rule_is_flat_properties_bag_without_wrapper()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {
                        "backendPort": 443,
                        "backendAddressPool": { "id": "{{PoolId}}" }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_rule_port_when_rules_json_is_single_rule_object()
    {
        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    {
                      "properties": {
                        "backendPort": 443,
                        "backendAddressPool": { "id": "{{PoolId}}" }
                      }
                    }
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_rule_port_when_rules_json_is_string_scalar_wrapping_array()
    {
        string innerRules =
            $$"""
            [
              {
                "properties": {
                  "backendPort": 443,
                  "backendAddressPool": { "id": "{{PoolId}}" }
                }
              }
            ]
            """;

        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] = JsonSerializer.Serialize(innerRules),
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_rule_port_when_rule_element_is_json_string_scalar()
    {
        string ruleObjectJson =
            $$"""
            {
              "properties": {
                "backendPort": 443,
                "backendAddressPool": { "id": "{{PoolId}}" }
              }
            }
            """;

        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {
                              "name": "addr1",
                              "properties": {
                                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
                ["loadBalancingRules"] =
                    $$"""
                    [
                      {{JsonSerializer.Serialize(ruleObjectJson)}}
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().Be(443);
    }

    [Fact]
    public void ResolveLoadBalancerBackends_reads_backend_when_backend_address_element_is_json_string_scalar()
    {
        string addressObjectJson =
            $$"""
            {
              "properties": {
                "networkInterfaceIPConfiguration": { "id": "{{NicIpConfigurationId}}" }
              }
            }
            """;

        GraphNode loadBalancer = new()
        {
            NodeId = "lb1",
            NodeType = "resource",
            Label = "lb1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "id": "{{PoolId}}",
                        "properties": {
                          "loadBalancerBackendAddresses": [
                            {{JsonSerializer.Serialize(addressObjectJson)}}
                          ]
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(loadBalancer);

        targets.Should().ContainSingle();
        targets[0].TargetArmId.Should().Be(NicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveApplicationGatewayBackends_reads_backend_resource_when_address_row_is_flat_without_properties_wrapper()
    {
        GraphNode applicationGateway = new()
        {
            NodeId = "agw1",
            NodeType = "resource",
            Label = "agw1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendAddresses": [
                            { "backendResourceId": "{{NicId}}" }
                          ]
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveApplicationGatewayBackends(applicationGateway);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().BeNull();
    }

    [Fact]
    public void ResolveApplicationGatewayBackends_reads_ip_configuration_from_backend_pool()
    {
        // Application Gateway ARM pools attach NICs through backendIPConfigurations.
        // backendAddresses carries IP or FQDN members and is a different list.
        GraphNode applicationGateway = new()
        {
            NodeId = "agw1",
            NodeType = "resource",
            Label = "agw1",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["backendAddressPools"] =
                    $$"""
                    [
                      {
                        "properties": {
                          "backendIPConfigurations": [
                            { "id": "{{NicIpConfigurationId}}" }
                          ]
                        }
                      }
                    ]
                    """,
            },
        };

        IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> targets =
            AzureInventoryLoadBalancerBackendTrafficResolver.ResolveApplicationGatewayBackends(applicationGateway);

        AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget target = targets.Should().ContainSingle().Subject;
        target.TargetArmId.Should().Be(NicId.ToLowerInvariant());
        target.RulePort.Should().BeNull();
    }
}
