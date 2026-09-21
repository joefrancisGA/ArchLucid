using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryEventGridSubscriptionEdgeMapperTests
{
    [Fact]
    public void MapSubscriptions_emits_observed_edge_for_destination_resource()
    {
        const string topicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/orders";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/dest";

        List<AzureInventoryEventGridSubscriptionRow> subscriptions =
        [
            new()
            {
                SourceResourceId = topicId,
                SubscriptionName = "to-storage",
                DestinationResourceId = storageId,
                DestinationKind = "StorageQueue",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryEventGridSubscriptionEdgeMapper.MapSubscriptions(subscriptions, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(topicId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(storageId));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.ConnectsTo);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryEventGridDestination);
    }
}
