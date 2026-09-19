using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAdfTriggerEdgeMapperTests
{
    [Fact]
    public void MapTriggers_emits_observed_edge_for_explicit_source_resource()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureInventoryAdfTriggerRow> triggers =
        [
            new()
            {
                FactoryResourceId = factoryId,
                TriggerResourceId = $"{factoryId}/triggers/BlobTrigger",
                TriggerName = "BlobTrigger",
                TriggerType = "BlobEventsTrigger",
                SourceResourceId = storageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfTriggerEdgeMapper.MapTriggers(triggers, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(storageId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(factoryId));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.ConnectsTo);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryAdfTriggerSource);
    }
}
