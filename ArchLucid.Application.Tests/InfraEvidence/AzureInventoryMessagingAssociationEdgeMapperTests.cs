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

        AzureInventoryMessagingAssociationEdgeMapper.MapAssociations(associations, relationships, keys, warnings);

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
}
