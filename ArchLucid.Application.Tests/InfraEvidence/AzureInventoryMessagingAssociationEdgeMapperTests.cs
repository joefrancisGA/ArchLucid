using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryMessagingAssociationEdgeMapperTests
{
    [Fact]
    public void MapAssociations_emits_contains_and_capture_edges()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string eventHubId = $"{namespaceId}/eventhubs/orders";
        const string captureStorageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/capturestore";

        List<AzureInventoryMessagingAssociationRow> associations =
        [
            new()
            {
                ParentResourceId = namespaceId,
                ChildResourceId = eventHubId,
                ChildName = "orders",
                ChildType = AzureInventoryMessagingAssociationTypes.EventHub,
                CaptureStorageAccountId = captureStorageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        HashSet<string> inventoried = new(StringComparer.OrdinalIgnoreCase)
        {
            ArmResourceIdNormalizer.Normalize(eventHubId),
        };

        AzureInventoryMessagingAssociationEdgeMapper.MapAssociations(associations, relationships, keys, warnings, inventoried);

        relationships.Should().HaveCount(2);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(namespaceId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(eventHubId)
            && r.RelationshipType == GraphEdgeTypes.Contains
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryExplicitParentChild);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(eventHubId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(captureStorageId)
            && r.RelationshipType == GraphEdgeTypes.ConnectsTo
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryEventHubCapture);
    }

    [Fact]
    public void MapAssociations_attaches_capture_to_namespace_when_child_hub_is_not_inventoried()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string eventHubId = $"{namespaceId}/eventhubs/orders";
        const string captureStorageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/capturestore";

        List<AzureInventoryMessagingAssociationRow> associations =
        [
            new()
            {
                ParentResourceId = namespaceId,
                ChildResourceId = eventHubId,
                ChildName = "orders",
                ChildType = AzureInventoryMessagingAssociationTypes.EventHub,
                CaptureStorageAccountId = captureStorageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        HashSet<string> inventoried = new(StringComparer.OrdinalIgnoreCase)
        {
            ArmResourceIdNormalizer.Normalize(namespaceId),
        };

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        AzureInventoryMessagingAssociationEdgeMapper.MapAssociations(
            associations,
            relationships,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [],
            inventoried);

        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(namespaceId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(captureStorageId)
            && r.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryEventHubCapture,
                "orders"));
    }

    [Fact]
    public void MapAssociations_emits_service_bus_forward_edges_only_for_known_children()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sbns";
        const string ordersId = $"{namespaceId}/queues/orders";
        const string archiveId = $"{namespaceId}/topics/archive";

        List<AzureInventoryMessagingAssociationRow> associations =
        [
            new()
            {
                ParentResourceId = namespaceId,
                ChildResourceId = ordersId,
                ChildName = "orders",
                ChildType = AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
            },
            new()
            {
                ParentResourceId = namespaceId,
                ChildResourceId = archiveId,
                ChildName = "archive",
                ChildType = AzureInventoryMessagingAssociationTypes.ServiceBusTopic,
            },
        ];
        associations[0] = new AzureInventoryMessagingAssociationRow
        {
            ParentResourceId = namespaceId,
            ChildResourceId = ordersId,
            ChildName = "orders",
            ChildType = AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
            ForwardToName = "archive",
        };

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        AzureInventoryMessagingAssociationEdgeMapper.MapAssociations(
            associations,
            relationships,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            []);

        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(ordersId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(archiveId)
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryServiceBusForwardTo);
    }
}
