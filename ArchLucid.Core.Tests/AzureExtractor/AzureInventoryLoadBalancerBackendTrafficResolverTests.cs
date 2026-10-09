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
