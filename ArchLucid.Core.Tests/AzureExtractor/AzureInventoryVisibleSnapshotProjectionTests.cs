using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryVisibleSnapshotProjectionTests
{
    [Fact]
    public void Apply_filters_omitted_resources_and_relationships_and_recounts_header()
    {
        AzureInventoryResourceRecord visibleResource = CreateResource(
            "visible",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1");
        AzureInventoryResourceRecord omittedResource = CreateResource(
            "omitted",
            "Microsoft.Network/dnszones",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/dnszones/dns1");
        AzureInventoryResourceRecord omittedSolutionByArmId = CreateResource(
            "omitted-solution",
            string.Empty,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security");
        AzureInventoryResourceRecord omittedLinkByArmId = CreateResource(
            "omitted-link",
            string.Empty,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1");

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                ResourceCount = 4,
                RelationshipCount = 2,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CaptureMethod = AzureInventoryCaptureMethod.HostedReader,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            Resources = [visibleResource, omittedResource, omittedSolutionByArmId, omittedLinkByArmId],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = visibleResource.ResourceRowId,
                    PropertyKey = "keep",
                },
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = omittedResource.ResourceRowId,
                    PropertyKey = "drop",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = visibleResource.AzureResourceId,
                    ToAzureResourceId = visibleResource.AzureResourceId,
                    RelationshipType = "self",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = omittedResource.AzureResourceId,
                    ToAzureResourceId = visibleResource.AzureResourceId,
                    RelationshipType = "dns-to-vm",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        AzureInventorySnapshotDetailReadModel normalized = AzureInventoryVisibleSnapshotProjection.Apply(snapshot);

        normalized.Resources.Should().ContainSingle(resource =>
            resource.AzureResourceId == visibleResource.AzureResourceId);
        normalized.Resources.Should().NotContain(resource =>
            resource.AzureResourceId.Contains("/solutions/", StringComparison.OrdinalIgnoreCase)
            || resource.AzureResourceId.Contains("/virtualNetworkLinks/", StringComparison.OrdinalIgnoreCase));
        normalized.Properties.Should().ContainSingle(property => property.PropertyKey == "keep");
        normalized.Relationships.Should().ContainSingle(relationship =>
            relationship.RelationshipType == "self");
        normalized.Header.ResourceCount.Should().Be(1);
        normalized.Header.RelationshipCount.Should().Be(1);
    }

    [Fact]
    public void Apply_filters_private_link_only_network_interfaces()
    {
        const string peNicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic";
        const string vmNicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-nic";
        const string privateEndpointArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";

        AzureInventoryResourceRecord vmNic = CreateResource(
            "vm-nic",
            "Microsoft.Network/networkInterfaces",
            vmNicArmId);
        AzureInventoryResourceRecord peNic = CreateResource(
            "pe-nic",
            "Microsoft.Network/networkInterfaces",
            peNicArmId);
        AzureInventoryResourceRecord privateEndpoint = CreateResource(
            "pe1",
            "Microsoft.Network/privateEndpoints",
            privateEndpointArmId);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                ResourceCount = 3,
                RelationshipCount = 2,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CaptureMethod = AzureInventoryCaptureMethod.HostedReader,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            Resources = [vmNic, peNic, privateEndpoint],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peNic.ResourceRowId,
                    PropertyKey = "privateEndpoint.id",
                    PropertyValue = privateEndpointArmId,
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = privateEndpointArmId,
                    ToAzureResourceId = peNicArmId,
                    RelationshipType = "CONNECTS_TO",
                    InferenceSource = "inventory-pe-nic",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    ToAzureResourceId = vmNicArmId,
                    RelationshipType = "CONNECTS_TO",
                    InferenceSource = "inventory-vm-nic",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        AzureInventorySnapshotDetailReadModel normalized = AzureInventoryVisibleSnapshotProjection.Apply(snapshot);

        normalized.Resources.Select(resource => resource.AzureResourceId).Should().BeEquivalentTo(
            [vmNicArmId, privateEndpointArmId]);
        normalized.Header.ResourceCount.Should().Be(2);
    }

    [Fact]
    public void FilterVisibleRelationships_keeps_principal_edges_to_visible_resources()
    {
        const string visibleArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        HashSet<string> visibleArmIds = new(StringComparer.OrdinalIgnoreCase)
        {
            visibleArmId,
        };

        List<AzureInventoryResourceRelationshipWrite> visible =
            AzureInventoryVisibleSnapshotProjection.FilterVisibleRelationships(
                [
                    new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = AzureInventoryPrincipalNodeId.Format("11111111-1111-1111-1111-111111111111"),
                        ToAzureResourceId = visibleArmId,
                        RelationshipType = "hasRole",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                    new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/dnszones/dns1",
                        ToAzureResourceId = visibleArmId,
                        RelationshipType = "dns-to-storage",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ],
                visibleArmIds);

        visible.Should().ContainSingle(relationship => relationship.RelationshipType == "hasRole");
    }

    [Fact]
    public void FilterVisibleRelationships_keeps_vnet_peering_when_remote_is_missing()
    {
        const string localVnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke";
        const string remoteVnet =
            "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub";
        HashSet<string> visibleArmIds = new(StringComparer.OrdinalIgnoreCase)
        {
            localVnet,
        };

        List<AzureInventoryResourceRelationshipWrite> visible =
            AzureInventoryVisibleSnapshotProjection.FilterVisibleRelationships(
                [
                    new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = localVnet,
                        ToAzureResourceId = remoteVnet,
                        RelationshipType = "PEERS_WITH",
                        InferenceSource = "inventory-vnet-peering",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ],
                visibleArmIds);

        visible.Should().ContainSingle(relationship =>
            relationship.RelationshipType == "PEERS_WITH"
            && relationship.ToAzureResourceId == remoteVnet);
    }

    [Fact]
    public void FilterVisibleRelationships_keeps_nic_to_subnet_when_vnet_parent_is_visible()
    {
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-nic";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet";
        HashSet<string> visibleArmIds = new(StringComparer.OrdinalIgnoreCase)
        {
            nicArmId,
            vnetArmId,
        };

        List<AzureInventoryResourceRelationshipWrite> visible =
            AzureInventoryVisibleSnapshotProjection.FilterVisibleRelationships(
                [
                    new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = nicArmId,
                        ToAzureResourceId = subnetArmId,
                        RelationshipType = "CONNECTS_TO",
                        InferenceSource = "inventory-nic-subnet",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                    new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/dnszones/dns1",
                        ToAzureResourceId = vnetArmId,
                        RelationshipType = "dns-to-vnet",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ],
                visibleArmIds);

        visible.Should().ContainSingle(relationship =>
            relationship.InferenceSource == "inventory-nic-subnet"
            && relationship.ToAzureResourceId == subnetArmId);
    }

    [Fact]
    public void BuildSqlAzureResourceIdVisiblePredicate_excludes_solutions_and_virtual_network_links()
    {
        string predicate = AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("AzureResourceId");

        predicate.Should().Contain("%/solutions/%");
        predicate.Should().Contain("%/smartdetectoralertrules/%");
        predicate.Should().Contain("%/virtualnetworklinks/%");
        predicate.Should().Contain("%/sshpublickeys/%");
    }

    [Fact]
    public void BuildSqlResourceTypeVisiblePredicate_keeps_null_or_blank_resource_type()
    {
        string predicate = AzureInventoryVisibleSnapshotProjection.BuildSqlResourceTypeVisiblePredicate("r.ResourceType");

        predicate.Should().Contain("r.ResourceType IS NULL");
        predicate.Should().Contain("r.ResourceType = N''");
        predicate.Should().Contain("r.ResourceType <> N'Microsoft.OperationsManagement/solutions'");
        predicate.Should().Contain("r.ResourceType <> N'Microsoft.AlertsManagement/smartDetectorAlertRules'");
    }

    [Fact]
    public void BuildSqlAzureResourceIdVisiblePredicate_keeps_null_or_blank_arm_id()
    {
        string predicate = AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("r.AzureResourceId");

        predicate.Should().Contain("r.AzureResourceId IS NULL");
        predicate.Should().Contain("r.AzureResourceId = N''");
        predicate.Should().Contain("%/solutions/%");
    }

    private static AzureInventoryResourceRecord CreateResource(
        string name,
        string resourceType,
        string azureResourceId)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
