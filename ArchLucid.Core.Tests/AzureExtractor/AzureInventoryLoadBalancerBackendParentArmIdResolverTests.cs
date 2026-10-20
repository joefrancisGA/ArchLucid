using System.Text.Json;

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

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_backend_ip_configuration_string_scalar_arm_id()
    {
        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "backendIPConfigurations": [
                    "{{VmssNicIpConfigurationId}}"
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
    public void ResolveFromBackendAddressPoolsJson_reads_backend_address_row_flat_without_properties_wrapper()
    {
        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {
                      "networkInterfaceIPConfiguration": { "id": "{{VmssNicIpConfigurationId}}" }
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
    public void ResolveFromBackendAddressPoolsJson_reads_flat_pool_properties_bag_without_wrapper()
    {
        string poolsJson =
            $$"""
            [
              {
                "loadBalancerBackendAddresses": [
                  {
                    "properties": {
                      "networkInterfaceIPConfiguration": { "id": "{{VmssNicIpConfigurationId}}" }
                    }
                  }
                ]
              }
            ]
            """;

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_single_pool_object_without_array_wrapper()
    {
        string poolsJson =
            $$"""
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
            """;

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_backend_when_network_interface_ip_configuration_reference_is_json_string_scalar_wrapping_id_object()
    {
        string referenceObjectJson = $$"""{"id": "{{VmssNicIpConfigurationId}}"}""";

        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {
                      "properties": {
                        "networkInterfaceIPConfiguration": {{JsonSerializer.Serialize(referenceObjectJson)}}
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
    public void ResolveFromBackendAddressPoolsJson_reads_backend_address_element_when_json_string_scalar_wraps_object()
    {
        string addressObjectJson =
            $$"""
            {
              "properties": {
                "networkInterfaceIPConfiguration": { "id": "{{VmssNicIpConfigurationId}}" }
              }
            }
            """;

        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {{JsonSerializer.Serialize(addressObjectJson)}}
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
    public void ResolveFromBackendAddressPoolsJson_reads_application_gateway_backend_addresses_backend_resource_id()
    {
        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "backendAddresses": [
                    {
                      "properties": {
                        "backendResourceId": "{{VmssNicId}}"
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
    public void ResolveFromBackendAddressPoolsJson_reads_application_gateway_backend_address_when_element_is_json_string_scalar()
    {
        string addressObjectJson =
            $$"""
            {
              "backendResourceId": "{{VmssNicId}}"
            }
            """;

        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "backendAddresses": [
                    {{JsonSerializer.Serialize(addressObjectJson)}}
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
    public void ResolveFromBackendAddressPoolsJson_reads_pools_when_json_is_string_scalar_wrapping_pool_array()
    {
        string inner =
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
        string poolsJson = JsonSerializer.Serialize(inner);

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_backend_when_pool_array_element_is_json_string_scalar_wrapping_pool_object()
    {
        string poolObject =
            $$"""
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
            """;

        string poolsJson =
            $$"""
            [
              {{JsonSerializer.Serialize(poolObject)}}
            ]
            """;

        IReadOnlyList<string> parentIds =
            AzureInventoryLoadBalancerBackendParentArmIdResolver.ResolveFromBackendAddressPoolsJson(poolsJson);

        parentIds.Should().ContainSingle().Subject.Should().Be(VmssNicId.ToLowerInvariant());
    }

    [Fact]
    public void ResolveFromBackendAddressPoolsJson_reads_backend_when_load_balancer_backend_address_is_json_string_scalar_arm_id()
    {
        string poolsJson =
            $$"""
            [
              {
                "properties": {
                  "loadBalancerBackendAddresses": [
                    {{JsonSerializer.Serialize(VmssNicIpConfigurationId)}}
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
