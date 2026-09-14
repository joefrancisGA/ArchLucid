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

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                ResourceCount = 2,
                RelationshipCount = 2,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CaptureMethod = AzureInventoryCaptureMethod.HostedReader,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            Resources = [visibleResource, omittedResource],
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
        normalized.Properties.Should().ContainSingle(property => property.PropertyKey == "keep");
        normalized.Relationships.Should().ContainSingle(relationship =>
            relationship.RelationshipType == "self");
        normalized.Header.ResourceCount.Should().Be(1);
        normalized.Header.RelationshipCount.Should().Be(1);
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
