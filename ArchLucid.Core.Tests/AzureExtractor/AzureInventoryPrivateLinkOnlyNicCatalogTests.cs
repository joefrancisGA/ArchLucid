using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryPrivateLinkOnlyNicCatalogTests
{
    private const string VmNicArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-nic";

    private const string PeNicArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic";

    private const string PrivateEndpointArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";

    [Fact]
    public void BuildOmittedNicArmIds_omits_private_endpoint_nics_not_attached_to_vms()
    {
        HashSet<string> omittedNicArmIds = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIds(
            [
                CreateInventoryRow(
                    "Microsoft.Network/privateEndpoints",
                    PrivateEndpointArmId,
                    new Dictionary<string, string>
                    {
                        ["networkInterfaces[0]"] = PeNicArmId,
                    }),
                CreateInventoryRow(
                    "Microsoft.Network/networkInterfaces",
                    PeNicArmId,
                    new Dictionary<string, string>
                    {
                        ["privateEndpoint.id"] = PrivateEndpointArmId,
                    }),
            ]);

        omittedNicArmIds.Should().ContainSingle().Which.Should().Be(ArmResourceIdNormalizer.Normalize(PeNicArmId));
        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                "Microsoft.Network/networkInterfaces",
                PeNicArmId,
                omittedNicArmIds)
            .Should()
            .BeTrue();
        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                "Microsoft.Network/networkInterfaces",
                VmNicArmId,
                omittedNicArmIds)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void BuildOmittedNicArmIds_keeps_vm_attached_nics_even_when_also_referenced_by_private_endpoint()
    {
        HashSet<string> omittedNicArmIds = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIds(
            [
                CreateInventoryRow(
                    "Microsoft.Compute/virtualMachines",
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    new Dictionary<string, string>
                    {
                        ["networkProfile.networkInterfaces[0]"] = VmNicArmId,
                    }),
                CreateInventoryRow(
                    "Microsoft.Network/privateEndpoints",
                    PrivateEndpointArmId,
                    new Dictionary<string, string>
                    {
                        ["networkInterfaces[0]"] = VmNicArmId,
                    }),
            ]);

        omittedNicArmIds.Should().BeEmpty();
    }

    [Fact]
    public void BuildOmittedNicArmIdsFromSnapshot_uses_inventory_pe_nic_relationship_inference_source()
    {
        AzureInventoryResourceRecord peNic = CreateSnapshotResource(PeNicArmId);
        AzureInventoryResourceRecord vmNic = CreateSnapshotResource(VmNicArmId);

        HashSet<string> omittedNicArmIds = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromSnapshot(
            [peNic, vmNic],
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = PrivateEndpointArmId,
                    ToAzureResourceId = PeNicArmId,
                    RelationshipType = "CONNECTS_TO",
                    InferenceSource = "inventory-pe-nic",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    ToAzureResourceId = VmNicArmId,
                    RelationshipType = "CONNECTS_TO",
                    InferenceSource = "inventory-vm-nic",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ]);

        omittedNicArmIds.Should().ContainSingle().Which.Should().Be(ArmResourceIdNormalizer.Normalize(PeNicArmId));
    }

    private static AzureExtractorExtendedResourceRow CreateInventoryRow(
        string resourceType,
        string azureResourceId,
        IReadOnlyDictionary<string, string> properties)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            Name = "resource",
            Properties = properties,
        };
    }

    private static AzureInventoryResourceRecord CreateSnapshotResource(string azureResourceId)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AzureResourceId = azureResourceId,
            ResourceType = "Microsoft.Network/networkInterfaces",
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
