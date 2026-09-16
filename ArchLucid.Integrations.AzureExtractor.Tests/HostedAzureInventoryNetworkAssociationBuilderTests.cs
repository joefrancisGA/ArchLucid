using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureInventoryNetworkAssociationBuilderTests
{
    [Fact]
    public void BuildZip_network_associations_include_nic_subnet_and_public_ip_rows()
    {
        HostedAzureArmResourceRecord nic = new(
            ResourceType: "Microsoft.Network/networkInterfaces",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
            Name: "nic1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["ipConfiguration.subnet.id"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default",
            });

        HostedAzureArmResourceRecord publicIp = new(
            ResourceType: "Microsoft.Network/publicIPAddresses",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1",
            Name: "pip1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["ipConfiguration.id"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([nic, publicIp]);

        Assert.Equal(2, associations.Count);
        Assert.Contains(
            associations,
            row => row.AssociationType == "nicToSubnet"
                   && row.FromResourceId == nic.ResourceId);
        Assert.Contains(
            associations,
            row => row.AssociationType == "publicIpToNic"
                   && row.FromResourceId == publicIp.ResourceId);
    }

    [Fact]
    public void Build_emits_vm_to_nic_and_two_nic_to_subnet_rows_for_multi_ipconfig_nic()
    {
        HostedAzureArmResourceRecord vm = new(
            ResourceType: "Microsoft.Compute/virtualMachines",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
            Name: "vm1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["networkProfile.networkInterfaces[0]"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
                ["networkProfile.networkInterfaces[1]"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic2",
            });

        HostedAzureArmResourceRecord nic = new(
            ResourceType: "Microsoft.Network/networkInterfaces",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
            Name: "nic1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["ipConfiguration.subnet.id[0]"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/a",
                ["ipConfiguration.subnet.id[1]"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/b",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([vm, nic]);

        Assert.Equal(4, associations.Count);
        Assert.Equal(2, associations.Count(row => row.AssociationType == "vmToNic"));
        Assert.Equal(2, associations.Count(row => row.AssociationType == "nicToSubnet"));
    }

    [Fact]
    public void Build_emits_private_endpoint_to_nic_association()
    {
        HostedAzureArmResourceRecord privateEndpoint = new(
            ResourceType: "Microsoft.Network/privateEndpoints",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1",
            Name: "pe1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["networkInterfaces[0]"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([privateEndpoint]);

        Assert.Single(associations);
        Assert.Equal("peToNic", associations[0].AssociationType);
        Assert.Contains("privateEndpoints/pe1", associations[0].FromResourceId, StringComparison.Ordinal);
        Assert.Contains("networkInterfaces/pe-nic", associations[0].ToResourceId, StringComparison.Ordinal);
    }

    [Fact]
    public void Build_emits_private_dns_vnet_link_association()
    {
        HostedAzureArmResourceRecord link = new(
            ResourceType: "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
            ResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1",
            Name: "link1",
            Location: "global",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["privateDnsZoneId"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1",
                ["virtualNetwork.id"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([link]);

        Assert.Single(associations);
        Assert.Equal("privateDnsVnetLink", associations[0].AssociationType);
        Assert.Contains("privateDnsZones/zone1", associations[0].FromResourceId, StringComparison.Ordinal);
        Assert.Contains("virtualNetworks/vnet1", associations[0].ToResourceId, StringComparison.Ordinal);
    }

    [Fact]
    public void BuildZip_omits_virtual_network_links_from_resources_json_but_keeps_associations()
    {
        HostedAzureArmResourceRecord storage = new(
            ResourceType: "Microsoft.Storage/storageAccounts",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            Name: "sa1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>());

        HostedAzureArmResourceRecord link = new(
            ResourceType: "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
            ResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1",
            Name: "link1",
            Location: "global",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["privateDnsZoneId"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1",
                ["virtualNetwork.id"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([storage, link]);

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            [storage, link],
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            networkAssociations: associations.ToList());

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream resourcesStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.Resources)!.Open();
        using JsonDocument resourcesDocument = JsonDocument.Parse(resourcesStream);

        Assert.Equal(1, resourcesDocument.RootElement.GetArrayLength());
        Assert.Equal(
            "Microsoft.Storage/storageAccounts",
            resourcesDocument.RootElement[0].GetProperty("resourceType").GetString());

        using Stream manifestStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.Manifest)!.Open();
        using JsonDocument manifestDocument = JsonDocument.Parse(manifestStream);

        Assert.Equal(1, manifestDocument.RootElement.GetProperty("resourceCount").GetInt32());

        using Stream networkStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.NetworkAssociations)!.Open();
        using JsonDocument networkDocument = JsonDocument.Parse(networkStream);

        Assert.Equal("privateDnsVnetLink", networkDocument.RootElement[0].GetProperty("associationType").GetString());
    }

    [Fact]
    public void BuildZip_writes_role_assignments_and_network_associations_entries()
    {
        HostedAzureArmRoleAssignmentRecord roleAssignment = new(
            Scope: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            PrincipalId: "11111111-1111-1111-1111-111111111111",
            PrincipalType: "User",
            RoleDefinitionId:
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c");

        HostedAzureArmNetworkAssociationRecord networkAssociation = new(
            FromResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
            ToResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default",
            AssociationType: "nicToSubnet");

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            [],
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            entraGroupMemberships: null,
            roleAssignments: [roleAssignment],
            networkAssociations: [networkAssociation]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        ZipArchiveEntry? roleAssignmentsEntry = archive.GetEntry(AzureExtractorPackageZipEntryNames.RoleAssignments);
        ZipArchiveEntry? networkAssociationsEntry = archive.GetEntry(AzureExtractorPackageZipEntryNames.NetworkAssociations);

        Assert.NotNull(roleAssignmentsEntry);
        Assert.NotNull(networkAssociationsEntry);

        using Stream roleStream = roleAssignmentsEntry!.Open();
        using JsonDocument roleDocument = JsonDocument.Parse(roleStream);

        Assert.Equal(JsonValueKind.Array, roleDocument.RootElement.ValueKind);
        Assert.Equal(
            "11111111-1111-1111-1111-111111111111",
            roleDocument.RootElement[0].GetProperty("principalId").GetString());
        Assert.Equal("standing", roleDocument.RootElement[0].GetProperty("pimEligibilityKind").GetString());

        using Stream networkStream = networkAssociationsEntry!.Open();
        using JsonDocument networkDocument = JsonDocument.Parse(networkStream);

        Assert.Equal("nicToSubnet", networkDocument.RootElement[0].GetProperty("associationType").GetString());
    }

    [Fact]
    public void Build_emits_vnet_peering_when_subnets_json_is_missing()
    {
        HostedAzureArmResourceRecord vnet = new(
            ResourceType: "Microsoft.Network/virtualNetworks",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a",
            Name: "vnet-a",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["virtualNetworkPeerings"] = """
                    [{"name":"peer-to-b","properties":{"remoteVirtualNetwork":{"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b"}}}]
                    """,
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([vnet]);

        Assert.Contains(
            associations,
            row => row.AssociationType == AzureInventoryRelationshipAssociationTypes.VnetPeering
                   && row.FromResourceId == vnet.ResourceId
                   && row.ToResourceId.Contains("virtualNetworks/vnet-b", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Build_emits_vnet_peering_from_peering_child_resource()
    {
        HostedAzureArmResourceRecord peering = new(
            ResourceType: "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
            ResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-to-b",
            Name: "peer-to-b",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["remoteVirtualNetwork.id"] =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b",
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([peering]);

        Assert.Single(associations);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.VnetPeering, associations[0].AssociationType);
        Assert.Contains("virtualNetworks/vnet-a", associations[0].FromResourceId, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("virtualNetworks/vnet-b", associations[0].ToResourceId, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Build_skips_peering_child_without_remote_vnet_id()
    {
        HostedAzureArmResourceRecord peering = new(
            ResourceType: "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
            ResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-to-b",
            Name: "peer-to-b",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>());

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([peering]);

        Assert.Empty(associations);
    }

    [Fact]
    public void Build_emits_nat_gateway_to_subnet_association()
    {
        HostedAzureArmResourceRecord natGateway = new(
            ResourceType: "Microsoft.Network/natGateways",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/natGateways/nat1",
            Name: "nat1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["subnets"] =
                    """
                    [
                      {
                        "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default"
                      }
                    ]
                    """,
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([natGateway]);

        Assert.Single(associations);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.NatGatewayToSubnet, associations[0].AssociationType);
    }

    [Fact]
    public void Build_emits_private_endpoint_dns_zone_group_association()
    {
        HostedAzureArmResourceRecord privateEndpoint = new(
            ResourceType: "Microsoft.Network/privateEndpoints",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1",
            Name: "pe1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["privateDnsZoneGroups"] =
                    """
                    [
                      {
                        "properties": {
                          "privateDnsZoneConfigs": [
                            {
                              "properties": {
                                "privateDnsZoneId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/privatelink.blob.core.windows.net"
                              }
                            }
                          ]
                        }
                      }
                    ]
                    """,
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([privateEndpoint]);

        Assert.Single(associations);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.PeDnsZoneGroup, associations[0].AssociationType);
    }

    [Fact]
    public void Build_emits_container_app_to_environment_association()
    {
        const string environmentId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/managedEnvironments/env1";

        HostedAzureArmResourceRecord containerApp = new(
            ResourceType: "Microsoft.App/containerApps",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1",
            Name: "app1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["managedEnvironmentId"] = environmentId,
            });

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> associations =
            HostedAzureInventoryNetworkAssociationBuilder.Build([containerApp]);

        Assert.Single(associations);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.ContainerAppToEnv, associations[0].AssociationType);
        Assert.Equal(environmentId, associations[0].ToResourceId);
    }
}
