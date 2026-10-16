using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryLoadBalancerBackendParentArmIdResolverTests
{
    private const string VmssNicId =
        "/subscriptions/sub/resourceGroups/MC_rg/providers/Microsoft.Compute/virtualMachineScaleSets/aks-agentpool/virtualMachines/0/networkInterfaces/aks-agentpool-nic";

    private const string VmssNicIpConfigurationId =
        "/subscriptions/sub/resourceGroups/MC_rg/providers/Microsoft.Compute/virtualMachineScaleSets/aks-agentpool/virtualMachines/0/networkInterfaces/aks-agentpool-nic/ipConfigurations/ipconfig1";

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_load_balancer_backend_addresses()
    {
        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {
                      "properties": {
                        "networkInterfaceIPConfiguration": { "id": "{{VmssNicIpConfigurationId}}" }
                      }
                    }
                  ]
                }
              }
            ]
            """;

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_pascal_case_properties_bag_on_pool()
    {
        string poolsJson =
            $$"""
            [
              {
                "Properties": {
                  "loadBalancerBackendAddresses": [
                    {
                      "properties": {
                        "networkInterfaceIPConfiguration": { "id": "{{VmssNicIpConfigurationId}}" }
                      }
                    }
                  ]
                }
              }
            ]
            """;

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }
}
