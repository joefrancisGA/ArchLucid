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

        using Stream networkStream = networkAssociationsEntry!.Open();
        using JsonDocument networkDocument = JsonDocument.Parse(networkStream);

        Assert.Equal("nicToSubnet", networkDocument.RootElement[0].GetProperty("associationType").GetString());
    }
}
